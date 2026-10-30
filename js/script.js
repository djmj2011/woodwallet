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
  var meta = function (n) { var m = $('meta[name="' + n + '"]'); return m ? m.content : ''; };
  var isSet = function (v) { return v && v.indexOf('YOUR_') !== 0; };

  var API = meta('order-api');
  function api(payload) {
    if (!isSet(API)) return Promise.reject(new Error('not connected'));
    return fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json(); });
  }
  function show(el, text) { el.textContent = text; el.hidden = false; }

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
    if (select) { select.value = state.finish; updateSummary(); }
  }

  function updateSummary() {
    var f = finishes[select.value];
    $('#sum-item').textContent = f.name;
    $('#sum-total').textContent = money(f.price) + ' CAD';
  }

  $$('.angle-btn').forEach(function (b) {
    b.addEventListener('click', function () { state.angle = b.dataset.angle; render(); });
  });
  $$('.finish-btn').forEach(function (b) {
    b.addEventListener('click', function () { state.finish = b.dataset.finish; render(); });
  });
  if (select) select.addEventListener('change', function () { state.finish = select.value; render(); });

  // ---------- Order page ----------
  var form = $('#order-form');
  if (form) {
    var payStep = $('#pay-step'), doneStep = $('#done-step'), errBox = $('#form-error'), ppErr = $('#pp-error');
    var adminBox = $('#admin-box');
    if (location.hash === '#admin') adminBox.hidden = false;

    var collect = function () {
      var d = {};
      new FormData(form).forEach(function (v, k) { d[k] = v; });
      return d;
    };

    var showDone = function (code) {
      form.hidden = true; payStep.hidden = true; doneStep.hidden = false;
      $('#order-code').textContent = code;
      doneStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // Send the order to our server, which checks the payment with PayPal
    var record = function (extra) {
      var d = collect();
      if (d.website) return Promise.resolve();
      var payload = Object.assign({ action: 'order' }, d, extra);
      return api(payload).then(function (res) {
        if (res.ok) { showDone(res.code); return; }
        var msg = res.error || 'Something went wrong.';
        if (extra.paypalOrderId) msg += ' If you were charged, please contact us and give this PayPal reference: ' + extra.paypalOrderId;
        show(extra.admin ? errBox : ppErr, msg);
      }).catch(function () {
        var msg = isSet(API) ? 'We could not reach our order system.' : 'The order system is not connected yet.';
        if (extra.paypalOrderId) msg += ' If you were charged, please contact us and give this PayPal reference: ' + extra.paypalOrderId;
        show(extra.admin ? errBox : ppErr, msg);
      });
    };

    var loadPayPal = function () {
      var client = meta('paypal-client-id');
      return new Promise(function (resolve, reject) {
        if (window.paypal && window.paypal.Buttons) return resolve();
        if (!isSet(client)) return reject(new Error('no client'));
        var s = document.createElement('script');
        s.src = 'https://www.paypal.com/sdk/js?client-id=' + encodeURIComponent(client) + '&currency=CAD&components=buttons&disable-funding=venmo';
        s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
      });
    };

    var renderButtons = function () {
      var holder = $('#paypal-buttons'), f = finishes[select.value];
      holder.innerHTML = '';
      window.paypal.Buttons({
        createOrder: function (_d, actions) {
          return actions.order.create({
            intent: 'CAPTURE',
            purchase_units: [{ description: 'Wood Wallet - ' + f.name, amount: { currency_code: 'CAD', value: f.price.toFixed(2) } }]
          });
        },
        onApprove: function (data, actions) {
          return actions.order.capture().then(function () { return record({ paypalOrderId: data.orderID }); });
        },
        onError: function () { show(ppErr, 'Something went wrong with PayPal. Please try again.'); }
      }).render('#paypal-buttons');
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = collect();
      if (d.website) return;
      errBox.hidden = true; ppErr.hidden = true;
      $('#pay-name').textContent = d.name.split(' ')[0];
      form.hidden = true; payStep.hidden = false;
      loadPayPal().then(renderButtons).catch(function () {
        show(ppErr, 'PayPal is not available right now. Please try again later.');
      });
      payStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    $('#back-btn').addEventListener('click', function () {
      payStep.hidden = true; form.hidden = false; $('#paypal-buttons').innerHTML = '';
    });

    $('#admin-btn').addEventListener('click', function () {
      errBox.hidden = true;
      if (!form.reportValidity()) return;
      record({ admin: $('#admin-pass').value });
    });
  }

  // ---------- Reviews page ----------
  var rform = $('#review-form');
  if (rform) {
    var rmsg = $('#review-msg'), list = $('#reviews-list');
    if (isSet(API)) {
      fetch(API + '?action=reviews').then(function (r) { return r.json(); }).then(function (res) {
        if (!res.ok || !res.reviews.length) return;
        list.innerHTML = '';
        res.reviews.forEach(function (rv) {
          var box = document.createElement('div'); box.className = 'review';
          var top = document.createElement('div');
          var stars = document.createElement('span'); stars.className = 'stars';
          var n = Math.max(1, Math.min(5, parseInt(rv.rating, 10) || 5));
          stars.textContent = '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
          var nm = document.createElement('strong'); nm.textContent = rv.name;
          top.appendChild(stars); top.appendChild(nm);
          var p = document.createElement('p'); p.textContent = rv.text;
          box.appendChild(top); box.appendChild(p); list.appendChild(box);
        });
      }).catch(function () {});
    }
    rform.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = {}; new FormData(rform).forEach(function (v, k) { d[k] = v; });
      if (d.website) return;
      rmsg.hidden = true;
      var btn = rform.querySelector('button[type=submit]'); btn.disabled = true;
      api(Object.assign({ action: 'review' }, d)).then(function (res) {
        if (res.ok) { rform.reset(); show(rmsg, 'Thank you! Your review was sent and will appear after we approve it.'); }
        else show(rmsg, res.error || 'Something went wrong.');
      }).catch(function () {
        show(rmsg, isSet(API) ? 'We could not send your review. Please try again.' : 'Reviews are not connected yet.');
      }).then(function () { btn.disabled = false; });
    });
  }

  // ---------- Mobile menu ----------
  var menuBtn = $('.menu-btn'), nav = $('#site-nav');
  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open);
    });
  }

  // ---------- Lightbox ----------
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
