/* Слайдеры дизайнера для ВСЕХ секций страницы (D-021, внутренние страницы).
   main.js дизайнера запускает только первую секцию каждого вида (document.querySelector), а на
   внутренних страницах их бывает несколько: «Сертификаты и лицензии» + «Благодарственные письма»
   на «О компании» — две секции letters. Здесь берём остальные, с теми же параметрами, что в main.js
   (videos / letters / works), через его window.f2hSlider. Уже запущенные (main.js) не трогаем.
   Подключение — отдельным тегом script с defer ПОСЛЕ main.js (src="/d/js/nd-sliders.js").
   Без Swiper / f2hSlider ничего не делает: ряды остаются прокручиваемыми (scroll-snap). */
(function () {
  'use strict';

  if (typeof window.f2hSlider !== 'function') {
    return;
  }
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var speed = reduced ? 0 : 300;

  // параметры — копия main.js дизайнера (секции videos, letters, works)
  var KINDS = {
    videos: {
      options: {
        slidesPerView: 1.15,
        spaceBetween: 16,
        speed: speed,
        watchSlidesProgress: true,
        breakpoints: {
          768: { slidesPerView: 2, spaceBetween: 24 },
          1200: { slidesPerView: 3, spaceBetween: 44 }
        }
      },
      activeClass: 'videos__slider--active'
    },
    letters: {
      options: {
        slidesPerView: 1.6,
        spaceBetween: 16,
        speed: speed,
        breakpoints: {
          768: { slidesPerView: 3, spaceBetween: 20 },
          1200: { slidesPerView: 4, spaceBetween: 32 }
        }
      },
      activeClass: 'letters__slider--active'
    },
    works: {
      options: {
        slidesPerView: 1.3,
        spaceBetween: 16,
        breakpoints: {
          768: { slidesPerView: 3, spaceBetween: 20 },
          1200: { slidesPerView: 4, spaceBetween: 24 }
        }
      },
      activeClass: 'works__slider--active'
    }
  };

  // Видео: постер → плеер Rutube по клику, ушедший из вида плеер снова становится постером
  // (то же, что делает main.js для первой секции).
  function videoPlayer(section) {
    var posters = new WeakMap();
    section.addEventListener('click', function (event) {
      var poster = event.target.closest('[data-js="video-play"]');
      if (!poster || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
        return;
      }
      event.preventDefault();
      var player = document.createElement('iframe');
      player.className = 'videos__player';
      player.setAttribute('data-js', 'video-player');
      player.src = poster.getAttribute('data-embed');
      player.title = poster.getAttribute('data-title');
      player.allow = 'autoplay; fullscreen; picture-in-picture; clipboard-write';
      player.allowFullscreen = true;
      player.loading = 'lazy';
      posters.set(player, poster);
      poster.replaceWith(player);
      player.focus();
    });
    return function restorePosters(swiper) {
      section.querySelectorAll('[data-js="video-player"]').forEach(function (player) {
        if (swiper.visibleSlides.indexOf(player.closest('[data-js="slider-slide"]')) === -1) {
          player.replaceWith(posters.get(player));
        }
      });
    };
  }

  Object.keys(KINDS).forEach(function (kind) {
    var sections = document.querySelectorAll('[data-js="' + kind + '"]');
    Array.prototype.forEach.call(sections, function (section) {
      var root = section.querySelector('[data-js="slider"]');
      // первую секцию уже запустил main.js (Swiper вешает на корень класс swiper и свойство .swiper)
      if (!root || root.swiper || root.classList.contains('swiper')) {
        return;
      }
      var options = Object.assign({}, KINDS[kind].options);
      if (kind === 'videos') {
        var restore = videoPlayer(section);
        options.on = { transitionStart: restore, resize: restore };
      }
      var slider = window.f2hSlider(root, options, { activeClass: KINDS[kind].activeClass, scope: section });
      // стрелки без Swiper ничего не делают: у videos/letters они скрыты, пока он не запущен
      var nav = section.querySelector('[data-js="slider-nav"]');
      if (slider && nav) {
        nav.hidden = false;
      }
    });
  });
})();
