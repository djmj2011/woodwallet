(function () {
  var finishes = {
    walnut: { name: 'Walnut Blend', price: 39, filter: 'none' },
    birch:  { name: 'Golden Birch', price: 39, filter: 'brightness(1.4) saturate(.75) sepia(.15)' },
    ebony:  { name: 'Ebony Timber', price: 42, filter: 'brightness(.6) contrast(1.1) saturate(.5)' }
  };
  var angles = { closed: 'Closed', back: 'Back', open: 'Open' };
  var state = { finish: 'walnut', angle: 'closed' };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var money = function (n) { return '$' + n.toFixed(2); };

  var img = $('#main-product-img'), label = $('#preset-label'), priceEl = $('#preset-price');
  var select = $('#order-finish-select'), qty = $('#quantity');

  function render() {
    var f = finishes[state.finish];
    img.src = 'images/hero_' + state.angle + '.png';
    img.style.filter = f.filter;
    label.textContent = angles[state.angle] + ' view, ' + f.name;
    priceEl.textContent = money(f.price);
    $$('.angle-btn').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.angle === state.angle); });
    $$('.finish-btn').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.finish === state.finish); });
    $$('.gallery img').forEach(function (g) { g.style.filter = f.filter; });
    select.value = state.finish;
    updateTotal();
  }

  function updateTotal() {
    var f = finishes[select.value];
    var q = Math.max(1, Math.min(10, parseInt(qty.value, 10) || 1));
    $('#sum-item').textContent = f.name + ' × ' + q;
    $('#sum-total').textContent = money(f.price * q);
  }

  $$('.angle-btn').forEach(function (b) {
    b.addEventListener('click', function () { state.angle = b.dataset.angle; render(); });
  });
  $$('.finish-btn').forEach(function (b) {
    b.addEventListener('click', function () { state.finish = b.dataset.finish; render(); });
  });
  select.addEventListener('change', function () { state.finish = select.value; render(); });
  qty.addEventListener('input', updateTotal);

  // Mobile menu
  var menuBtn = $('.menu-btn'), nav = $('#site-nav');
  menuBtn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
  });
  $$('#site-nav a').forEach(function (a) {
    a.addEventListener('click', function () { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', false); });
  });

  // Lightbox
  var box = $('#lightbox'), boxImg = $('#lightbox-img');
  function closeBox() { box.classList.remove('open'); }
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

  render();
})();
