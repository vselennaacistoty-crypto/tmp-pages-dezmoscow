/* Вкладки прайса (D-021, семейство catalog: _redesign/blocks/catalog.py, styles/blocks/catalog.css).
   Без скрипта блок [data-js="nd-tabs"] — разделы подряд с якорным меню (ссылки на #id),
   ничего не спрятано. Скрипт превращает каждое меню [data-nd-tablist] во вкладки по WAI-ARIA:
   role=tablist/tab/tabpanel, aria-selected, aria-controls, один tabindex=0 на группу,
   стрелки ←/→/↑/↓, Home/End, пробел. Неактивные панели получают hidden.
   #якорь в адресе (при загрузке и при смене) открывает нужный раздел и услугу.
   Без зависимостей; если блока на странице нет — ничего не делает. */
(function () {
  'use strict';

  var FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]';

  function panelOf(tab) {
    var id = (tab.getAttribute('href') || '').slice(1);
    return id ? document.getElementById(id) : null;
  }

  // лента вкладок на телефоне прокручивается вбок: выбранную подвигаем в видимую часть
  // (scrollLeft, а не scrollIntoView — тот дёргал бы страницу по вертикали)
  function reveal(list, tab) {
    if (list.scrollWidth <= list.clientWidth) return;
    var l = list.getBoundingClientRect();
    var t = tab.getBoundingClientRect();
    if (t.left < l.left) list.scrollLeft -= l.left - t.left + 16;
    else if (t.right > l.right) list.scrollLeft += t.right - l.right + 16;
  }

  function Group(list) {
    var self = this;
    this.list = list;
    this.tabs = [];
    [].forEach.call(list.querySelectorAll('a[href^="#"]'), function (a) {
      var p = panelOf(a);
      if (!p) return;
      if (!a.id) a.id = p.id + '-tab';
      a.setAttribute('role', 'tab');
      a.setAttribute('aria-controls', p.id);
      p.setAttribute('role', 'tabpanel');
      p.setAttribute('aria-labelledby', a.id);
      // панель без своих фокусируемых элементов (таблица) получает фокус сама — так советует APG
      if (!p.hasAttribute('tabindex') && !p.querySelector(FOCUSABLE)) p.tabIndex = 0;
      if (a.parentElement && a.parentElement.tagName === 'LI') a.parentElement.setAttribute('role', 'presentation');
      self.tabs.push(a);
    });
    if (!this.tabs.length) return;
    list.setAttribute('role', 'tablist');

    list.addEventListener('click', function (e) {
      var t = e.target.closest('[role="tab"]');
      var i = self.tabs.indexOf(t);
      if (i < 0) return;
      e.preventDefault(); // адрес не меняем и к якорю не прыгаем
      self.select(i, false, true);
    });

    list.addEventListener('keydown', function (e) {
      var i = self.tabs.indexOf(e.target);
      if (i < 0) return;
      var n = self.tabs.length;
      var j = null;
      switch (e.key) {
        case 'ArrowRight': case 'ArrowDown': j = (i + 1) % n; break;
        case 'ArrowLeft': case 'ArrowUp': j = (i - 1 + n) % n; break;
        case 'Home': j = 0; break;
        case 'End': j = n - 1; break;
        case ' ': case 'Spacebar': j = i; break; // ссылка не нажимается пробелом — помогаем
        default: return;
      }
      e.preventDefault();
      self.select(j, true, true);
    });

    this.select(0, false, false);
  }

  Group.prototype.select = function (index, focus, byUser) {
    this.tabs.forEach(function (t, k) {
      var on = k === index;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      var p = panelOf(t);
      if (p) p.hidden = !on;
    });
    var tab = this.tabs[index];
    if (focus) tab.focus({ preventScroll: true });
    if (byUser) reveal(this.list, tab);
  };

  // открыть вкладки, в которых лежит элемент с этим id (раздел, затем услугу)
  Group.prototype.indexFor = function (el) {
    for (var i = 0; i < this.tabs.length; i++) {
      var p = panelOf(this.tabs[i]);
      if (p && (p === el || p.contains(el))) return i;
    }
    return -1;
  };

  function openHash(groups, scroll) {
    var id = decodeURIComponent((location.hash || '').slice(1));
    var el = id ? document.getElementById(id) : null;
    if (!el) return;
    var hit = false;
    groups.forEach(function (g) {
      var i = g.indexFor(el);
      if (i >= 0) { g.select(i, false, false); hit = true; }
    });
    if (hit && scroll) el.scrollIntoView({ block: 'start' });
  }

  function init(root) {
    if (root.getAttribute('data-nd-tabs') === 'on') return;
    var groups = [];
    [].forEach.call(root.querySelectorAll('[data-nd-tablist]'), function (list) {
      var g = new Group(list);
      if (g.tabs.length) groups.push(g);
    });
    if (!groups.length) return;
    root.setAttribute('data-nd-tabs', 'on'); // по нему CSS включает раскладку вкладок
    openHash(groups, true);
    window.addEventListener('hashchange', function () { openHash(groups, true); });
  }

  function start() {
    [].forEach.call(document.querySelectorAll('[data-js="nd-tabs"]'), init);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
