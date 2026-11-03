/* Отзывы: поведение копии виджета SmartWidgets (D-021). Разметку собирает
   scripts/render-dynamic.mjs из lib/reviews.json, здесь только интерактив:
   вкладки площадок, «Оставить отзыв», «Читать полностью», «Ответ компании», «Еще».
   Без зависимостей; если блока на странице нет — ничего не делает. */
(function () {
  'use strict';

  var NA_STRANICE = 6; // столько карточек виджет показывает сразу и добавляет по «Еще»

  function ocenok(n) { return n % 10 === 1 && n % 100 !== 11 ? 'оценки' : 'оценок'; }
  function tys(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

  function init(rw) {
    var tabs = [].slice.call(rw.querySelectorAll('[data-rw-tab]'));
    var tabsBody = rw.querySelector('[data-rw-tabs]');
    var strelka = rw.querySelector('[data-rw-scroll]');
    var items = [].slice.call(rw.querySelectorAll('.rw-item'));
    var eshche = rw.querySelector('[data-rw-next]');
    var leave = rw.querySelector('[data-rw-leave]');
    var menu = rw.querySelector('[data-rw-menu]');
    var num = rw.querySelector('[data-rw-num]');
    var count = rw.querySelector('[data-rw-count]');
    var word = rw.querySelector('[data-rw-word]');
    var tekushaya = 'all';
    var pokazano = NA_STRANICE;

    function podhodyat() {
      return items.filter(function (it) { return tekushaya === 'all' || it.getAttribute('data-platform') === tekushaya; });
    }

    // «Читать полностью» нужна только там, где текст не влез в три строки
    function izmerit() {
      items.forEach(function (it) {
        if (it.hidden) return;
        var body = it.querySelector('[data-rw-body]');
        var btn = it.querySelector('[data-rw-more]');
        if (!body || !btn || body.classList.contains('is-full')) return;
        btn.hidden = body.scrollHeight <= body.clientHeight + 1;
      });
    }

    function pokazat() {
      var spisok = podhodyat();
      items.forEach(function (it) { it.hidden = true; });
      spisok.forEach(function (it, i) { it.hidden = i >= pokazano; });
      if (eshche) eshche.parentNode.hidden = spisok.length <= pokazano;
      requestAnimationFrame(izmerit);
    }

    function strelkaNado() {
      if (!strelka || !tabsBody) return;
      strelka.hidden = tabsBody.scrollLeft + tabsBody.clientWidth >= tabsBody.scrollWidth - 2;
    }

    function zakrytMenu() {
      if (!menu || menu.hidden) return;
      menu.hidden = true;
      leave.setAttribute('aria-expanded', 'false');
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) {
          var on = t === tab;
          t.classList.toggle('is-active', on);
          t.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        tekushaya = tab.getAttribute('data-rw-tab');
        pokazano = NA_STRANICE;
        var n = +tab.getAttribute('data-count') || 0;
        if (num) num.textContent = tab.getAttribute('data-rating');
        if (count) count.textContent = tys(n);
        if (word) word.textContent = ocenok(n);
        zakrytMenu();
        pokazat();
      });
    });

    if (strelka && tabsBody) {
      strelka.addEventListener('click', function () { tabsBody.scrollBy({ left: 200, behavior: 'smooth' }); });
      tabsBody.addEventListener('scroll', strelkaNado, { passive: true });
    }

    // на «Все отзывы» — список площадок, на вкладке площадки — сразу её форма отзыва
    if (leave && menu) {
      leave.addEventListener('click', function (e) {
        e.stopPropagation();
        if (tekushaya !== 'all') {
          var ssylka = menu.querySelector('[data-rw-add="' + tekushaya + '"]');
          if (ssylka) window.open(ssylka.href, '_blank', 'noopener');
          return;
        }
        menu.hidden = !menu.hidden;
        leave.setAttribute('aria-expanded', menu.hidden ? 'false' : 'true');
      });
      document.addEventListener('click', function (e) { if (!menu.contains(e.target)) zakrytMenu(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') zakrytMenu(); });
    }

    rw.addEventListener('click', function (e) {
      var more = e.target.closest('[data-rw-more]');
      if (more) {
        var body = more.closest('.rw-item').querySelector('[data-rw-body]');
        var full = body.classList.toggle('is-full');
        more.textContent = full ? 'Скрыть' : 'Читать полностью';
        return;
      }
      var ans = e.target.closest('[data-rw-answer]');
      if (ans) {
        var box = ans.closest('.rw-item').querySelector('.rw-item__answer');
        if (!box) return;
        box.hidden = !box.hidden;
        ans.setAttribute('aria-expanded', box.hidden ? 'false' : 'true');
      }
    });

    if (eshche) {
      eshche.addEventListener('click', function () {
        pokazano += NA_STRANICE;
        pokazat();
      });
    }

    var t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(function () { izmerit(); strelkaNado(); }, 150);
    });

    pokazat();
    strelkaNado();

    // Внутренние страницы: карточек в HTML нет, они в общем файле (data-rw-src) —
    // подгружаем, когда блок на подходе, как это делал SmartWidgets.
    var list = rw.querySelector('[data-rw-src]');
    if (!list || items.length) return;
    var zagruzheno = false;
    function zagruzit() {
      if (zagruzheno) return;
      zagruzheno = true;
      fetch(list.getAttribute('data-rw-src'))
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
        .then(function (html) {
          list.innerHTML = html;
          items = [].slice.call(list.querySelectorAll('.rw-item'));
          pokazat();
        })
        .catch(function () { zagruzheno = false; });
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (zapisi) {
        if (zapisi.some(function (z) { return z.isIntersecting; })) { io.disconnect(); zagruzit(); }
      }, { rootMargin: '800px 0px' });
      io.observe(rw);
    } else {
      zagruzit();
    }
  }

  function start() { [].forEach.call(document.querySelectorAll('[data-rw]'), init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
