(function () {
  var finishes = {
    walnut: { name: 'Walnut Blend', price: 39, filter: 'none' },
    birch:  { name: 'Golden Birch', price: 39, filter: 'brightness(1.4) saturate(.75) sepia(.15)' },
    ebony:  { name: 'Ebony Timber', price: 42, filter: 'brightness(.6) contrast(1.1) saturate(.5)' }
  };
  var angles = { closed: 'Closed', back: 'Back', open: 'Open' };
  var state = { finish: 'walnut', angle: 'closed' };
  try { var saved = sessionStorage.getItem('tv-finish'); if (finishes[saved]) state.finish = saved; } catch (e) {}

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var money = function (n) { return '$' + n.toFixed(2); };

  var img = $('#main-product-img'), label = $('#preset-label'), priceEl = $('#preset-price');
  var select = $('#order-finish-select');

  function render() {
    var f = finishes[state.finish];
    try { sessionStorage.setItem('tv-finish', state.finish); } catch (e) {}
    if (img) {
      img.src = 'images/hero_' + state.angle + '.png';
      img.style.filter = f.filter;
      label.textContent = angles[state.angle] + ' view, ' + f.name;
      priceEl.textContent = money(f.price);
    }
    $$('.angle-btn').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.angle === state.angle); });
    $$('.finish-btn').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.finish === state.finish); });
    $$('.gallery img').forEach(function (g) { g.style.filter = f.filter; });
    if (select) { select.value = state.finish; updateOrder(); }
  }

  // Order page
  var rendered = {};
  var payStep = $('#pay-step');
  function updateOrder() {
    var f = finishes[select.value];
    $('#sum-item').textContent = f.name;
    $('#sum-total').textContent = money(f.price) + ' CAD';
    if (!payStep || payStep.hidden) return;
    $$('[data-btn]').forEach(function (c) { c.hidden = c.dataset.finish !== select.value; });
    var box = $('[data-finish="' + select.value + '"][data-btn]');
    if (!box || rendered[select.value]) return;
    if (!window.paypal || !window.paypal.HostedButtons) { $('#pp-error').hidden = false; return; }
    rendered[select.value] = true;
    window.paypal.HostedButtons({ hostedButtonId: box.dataset.btn }).render('#' + box.id);
  }

  var form = $('#order-form');
  if (form) {
    var errBox = $('#form-error');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      if (data.website) return; // spam trap
      var hook = form.dataset.webhook, btn = form.querySelector('button[type=submit]');
      errBox.hidden = true;
      var last = 0;
      try { last = parseInt(sessionStorage.getItem('tv-sent') || '0', 10); } catch (x) {}
      if (Date.now() - last < 30000) {
        errBox.textContent = 'Please wait a few seconds before sending another order.'; errBox.hidden = false; return;
      }
      var clip = function (s, n) { return String(s || '').trim().slice(0, n); };
      var f = finishes[data.finish];
      var payload = {
        allowed_mentions: { parse: [] },
        embeds: [{
          title: 'New order request (not paid yet)',
          color: 0x5865f2,
          fields: [
            { name: 'Finish', value: f.name + ' ($' + f.price + ' CAD)' },
            { name: 'Name', value: clip(data.name, 100) || '-', inline: true },
            { name: 'Email', value: clip(data.email, 150) || '-', inline: true },
            { name: 'Ship to', value: [data.street, data.city, data.region, data.postal, data.country].map(function (v) { return clip(v, 150); }).filter(Boolean).join(', ') },
            { name: 'Notes', value: clip(data.notes, 500) || 'None' }
          ],
          timestamp: new Date().toISOString()
        }]
      };
      btn.disabled = true; btn.textContent = 'Sending...';
      fetch(hook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then(function (r) { if (!r.ok) throw new Error('bad'); })
        .then(function () { try { sessionStorage.setItem('tv-sent', String(Date.now())); } catch (x) {} })
        .then(function () {
          $('#pay-name').textContent = data.name.split(' ')[0];
          form.hidden = true; payStep.hidden = false;
          updateOrder();
          payStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
        })
        .catch(function () {
          errBox.textContent = 'Sorry, we could not send your order. Please check your details and try again.';
          errBox.hidden = false; btn.disabled = false; btn.textContent = 'Continue to payment';
        });
    });
  }

  $$('.angle-btn').forEach(function (b) {
    b.addEventListener('click', function () { state.angle = b.dataset.angle; render(); });
  });
  $$('.finish-btn').forEach(function (b) {
    b.addEventListener('click', function () { state.finish = b.dataset.finish; render(); });
  });
  if (select) select.addEventListener('change', function () { state.finish = select.value; render(); });

  // Mobile menu
  var menuBtn = $('.menu-btn'), nav = $('#site-nav');
  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open);
    });
  }

  // Lightbox
  var box = $('#lightbox');
  if (box) {
    var boxImg = $('#lightbox-img');
    var closeBox = function () { box.classList.remove('open'); };
    $$('.shot').forEach(function (s) {
      s.addEventListener('click', function () {
        boxImg.src = s.dataset.img;
        boxImg.style.filter = finishes[state.finish].filter;
        box.classList.add('open');
      });
    });
    $('#close-lightbox-btn').addEventListener('click', closeBox);
    box.addEventListener('click', function (e) { if (e.target === box) closeBox(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeBox(); });
  }

  render();
})();
