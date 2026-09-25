/* ==========================================================================
   Aarav Singh — Portfolio interactions
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var navWrap = document.querySelector('.nav-wrap');
  var navLinks = document.getElementById('nav-links');
  var menuToggle = document.querySelector('.menu-toggle');
  var progress = document.querySelector('.scroll-progress');
  var toTop = document.querySelector('.to-top');

  /* ---------- Mobile menu ---------- */
  function setMenu(open) {
    navWrap.classList.toggle('menu-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  menuToggle.addEventListener('click', function () {
    setMenu(!navWrap.classList.contains('menu-open'));
  });

  navLinks.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });

  document.addEventListener('click', function (e) {
    if (navWrap.classList.contains('menu-open') && !navWrap.contains(e.target)) setMenu(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && navWrap.classList.contains('menu-open')) {
      setMenu(false);
      menuToggle.focus();
    }
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 900) setMenu(false);
  });

  /* ---------- Smooth, inertial scrolling (Lenis) ---------- */
  var lenis = null;

  if (window.Lenis && !reduceMotion) {
    lenis = new window.Lenis({ lerp: 0.09, wheelMultiplier: 1, touchMultiplier: 1.4 });

    var raf = function (time) {
      lenis.raf(time);
      window.requestAnimationFrame(raf);
    };
    window.requestAnimationFrame(raf);

    // In-page links glide to their section, stopping below the sticky nav
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href^="#"]');
      if (!link || link.getAttribute('href').length < 2) return;
      var target = document.getElementById(link.getAttribute('href').slice(1));
      if (!target) return;
      e.preventDefault();
      var offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      lenis.scrollTo(target, {
        offset: -offset,
        duration: 1.2,
        easing: function (t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }
      });
      history.pushState(null, '', '#' + target.id);
    });
  }

  /* ---------- Scroll: progress bar, nav state, back-to-top ---------- */
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.setProperty('--progress', max > 0 ? (y / max).toFixed(4) : 0);
    navWrap.classList.toggle('scrolled', y > 20);
    toTop.classList.toggle('show', y > 600);
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });
  onScroll();

  /* ---------- Active nav link ---------- */
  var linkMap = {};
  navLinks.querySelectorAll('a:not(.button)').forEach(function (a) {
    linkMap[a.getAttribute('href').slice(1)] = a;
  });

  if ('IntersectionObserver' in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        Object.keys(linkMap).forEach(function (id) {
          linkMap[id].classList.toggle('active', id === entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    Object.keys(linkMap).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) sectionObserver.observe(section);
    });
  }

  /* ---------- Animated counters ---------- */
  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (reduceMotion) {
      el.textContent = target;
      return;
    }
    var duration = 1600;
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var t = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased);
      if (t < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  /* ---------- Scroll reveal (with stagger between siblings) ---------- */
  var reveals = document.querySelectorAll('.reveal');
  var counters = document.querySelectorAll('[data-count]');

  reveals.forEach(function (el) {
    var siblings = Array.prototype.filter.call(el.parentElement.children, function (c) {
      return c.classList.contains('reveal');
    });
    var index = siblings.indexOf(el);
    if (index > 0) el.style.setProperty('--delay', (index * 0.08).toFixed(2) + 's');

    el.addEventListener('transitionend', function handler(e) {
      if (e.propertyName === 'opacity' && el.classList.contains('in-view')) {
        el.classList.add('revealed');
        el.removeEventListener('transitionend', handler);
      }
    });
  });

  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in-view');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { revealObserver.observe(el); });

    var countObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        // Hero counters wait for the entrance animation to settle
        var delay = entry.target.closest('.hero') ? 700 : 0;
        setTimeout(function () { animateCount(entry.target); }, delay);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { countObserver.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in-view', 'revealed'); });
    counters.forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
  }

  /* ---------- Portrait tilt (mouse / pen only) ---------- */
  var tilt = document.querySelector('[data-tilt]');
  var hoverCapable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (tilt && hoverCapable && !reduceMotion) {
    var visual = tilt.parentElement;
    visual.addEventListener('pointermove', function (e) {
      var r = visual.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.setProperty('--ry', (x * 14).toFixed(2) + 'deg');
      tilt.style.setProperty('--rx', (-y * 14).toFixed(2) + 'deg');
    });
    visual.addEventListener('pointerleave', function () {
      tilt.style.setProperty('--ry', '0deg');
      tilt.style.setProperty('--rx', '0deg');
    });
  }

  /* ---------- Trusted-by marquee: duplicate logos for a seamless loop ---------- */
  var track = document.querySelector('.trusted-track');
  if (track && !reduceMotion) {
    Array.prototype.slice.call(track.children).forEach(function (item) {
      var clone = item.cloneNode(true);
      clone.classList.add('dup');
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });
  }

  /* ---------- Project filter (live sites first) ---------- */
  var filterBtns = document.querySelectorAll('.project-filter button');
  var projects = document.querySelectorAll('.project-card');

  function applyFilter(type, animate) {
    projects.forEach(function (card) {
      var show = type === 'all' || card.getAttribute('data-type') === type;
      var wasHidden = card.classList.contains('is-hidden');
      card.classList.toggle('is-hidden', !show);
      if (show) {
        // Cards shown by a filter should be visible even if never scrolled to
        card.classList.add('in-view', 'revealed');
        if (animate && wasHidden && !reduceMotion) {
          card.classList.remove('pop-in');
          void card.offsetWidth;
          card.classList.add('pop-in');
        }
      }
    });
  }

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-pressed', String(b === btn));
      });
      applyFilter(btn.getAttribute('data-filter'), true);
    });
  });

  // Initial state: only live sites, without forcing their reveal
  projects.forEach(function (card) {
    card.classList.toggle('is-hidden', card.getAttribute('data-type') !== 'live');
  });

  /* ---------- Contact form ---------- */
  var form = document.querySelector('.contact-form');
  if (form) {
    var submitBtn = form.querySelector('button[type="submit"]');
    var originalLabel = submitBtn.innerHTML;
    var resetTimer;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // No backend: hand the message to the visitor's email app
      var data = new FormData(form);
      var subject = 'Portfolio enquiry' + (data.get('project') ? ' — ' + data.get('project') : '') + ' from ' + data.get('name');
      var body = data.get('message') + '\n\n— ' + data.get('name') + ' (' + data.get('email') + ')';
      window.location.href = 'mailto:ugoprince738@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      submitBtn.classList.add('sent');
      submitBtn.textContent = 'Opening your email app ✓';
      form.reset();
      clearTimeout(resetTimer);
      resetTimer = setTimeout(function () {
        submitBtn.classList.remove('sent');
        submitBtn.innerHTML = originalLabel;
      }, 4000);
    });

    // Shake the form when the browser blocks an invalid submit
    form.addEventListener('invalid', function () {
      if (reduceMotion) return;
      form.classList.remove('shake');
      void form.offsetWidth; // restart animation
      form.classList.add('shake');
    }, true);

    form.addEventListener('animationend', function () {
      form.classList.remove('shake');
    });
  }

  /* ---------- Re-align deep links (#work etc.) after layout changes above ---------- */
  if (window.location.hash.length > 1) {
    var target = document.getElementById(window.location.hash.slice(1));
    if (target) window.requestAnimationFrame(function () { target.scrollIntoView(); });
  }

  /* ---------- Footer year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
