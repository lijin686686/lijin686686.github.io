/* Jin Li · personal site — v2
   - Language: ?lang=zh|en in the URL (shareable, combined with #section).
     Both languages live side by side in the HTML as [data-l="en"] / [data-l="zh"];
     CSS hides the inactive one based on <html lang>.
   - Title / description / aria-labels / alt text switch with the language.
   - Sidebar name only appears after the big hero name scrolls away.
*/
(function () {
  'use strict';
  var root = document.documentElement;

  var META = {
    en: {
      title: 'Jin Li · 李锦 — Tsinghua University',
      description: 'Jin Li (李锦), undergraduate in the Department of Automation, Tsinghua University, working on world models and embodied intelligence. Co-second author of AmbiguousWorld (NeurIPS 2026).',
      status: 'Switched to English'
    },
    zh: {
      title: '李锦 Jin Li · 清华大学自动化系',
      description: '李锦，清华大学自动化系本科生，研究兴趣为世界模型与具身智能；AmbiguousWorld（NeurIPS 2026）共同第二作者。',
      status: '已切换为中文'
    }
  };

  // Remember English aria-labels / alt text so we can switch back.
  var ariaTargets = Array.prototype.slice.call(document.querySelectorAll('[data-aria-zh]'));
  ariaTargets.forEach(function (el) { el.dataset.ariaEn = el.getAttribute('aria-label') || ''; });
  var altTargets = Array.prototype.slice.call(document.querySelectorAll('img[data-alt-zh]'));
  altTargets.forEach(function (el) { el.dataset.altEn = el.getAttribute('alt') || ''; });
  var descMeta = document.querySelector('meta[name="description"]');
  var langButtons = Array.prototype.slice.call(document.querySelectorAll('[data-language]'));
  var status = document.getElementById('language-status');

  function currentLang() {
    return new URLSearchParams(location.search).get('lang') === 'zh' ? 'zh' : 'en';
  }

  function apply(lang, announce) {
    var zh = lang === 'zh';
    root.lang = zh ? 'zh-CN' : 'en';
    document.title = META[lang].title;
    if (descMeta) descMeta.setAttribute('content', META[lang].description);
    ariaTargets.forEach(function (el) { el.setAttribute('aria-label', zh ? el.dataset.ariaZh : el.dataset.ariaEn); });
    altTargets.forEach(function (el) { el.setAttribute('alt', zh ? el.dataset.altZh : el.dataset.altEn); });
    langButtons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.language === lang)); });
    if (announce && status) status.textContent = META[lang].status;
  }

  function setLang(lang) {
    var url = new URL(location.href);
    if (lang === 'zh') url.searchParams.set('lang', 'zh');
    else url.searchParams.set('lang', 'en');
    history.replaceState(null, '', url.pathname + url.search + url.hash);
    apply(lang, true);
  }

  langButtons.forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.dataset.language); });
  });
  apply(currentLang(), false);

  /* ---------- active section in the sidebar ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.profile-nav a'));
  var sections = Array.prototype.slice.call(document.querySelectorAll('main > .section'));

  function updateActive() {
    var line = (parseFloat(getComputedStyle(root).scrollPaddingTop) || 0) + 8;
    var active = sections[0];
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= line) active = sections[i];
    }
    // At the very bottom, the last section is active even if it is short.
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) active = sections[sections.length - 1];
    navLinks.forEach(function (a) {
      if (a.getAttribute('href') === '#' + active.id) {
        a.setAttribute('aria-current', 'location');
        if (window.matchMedia('(max-width:760px)').matches && a.scrollIntoView) {
          var nav = a.parentElement;
          var left = a.offsetLeft - nav.clientWidth / 2 + a.clientWidth / 2;
          nav.scrollTo({ left: left, behavior: 'smooth' });
        }
      } else a.removeAttribute('aria-current');
    });
  }
  var frame = 0;
  window.addEventListener('scroll', function () {
    if (frame) return;
    frame = requestAnimationFrame(function () { frame = 0; updateActive(); });
  }, { passive: true });
  window.addEventListener('resize', updateActive);
  updateActive();

  /* ---------- sidebar name: show only once the hero name is off-screen ---------- */
  var heroName = document.querySelector('.hero-name');
  var sidebarName = document.querySelector('.site-name');
  function showSidebarName(visible) {
    document.body.classList.toggle('name-visible', visible);
    if (sidebarName) {
      sidebarName.setAttribute('aria-hidden', String(!visible));
      sidebarName.setAttribute('tabindex', visible ? '0' : '-1');
    }
  }
  if (heroName && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      showSidebarName(!entries[0].isIntersecting);
    }, { threshold: 0 }).observe(heroName);
  } else {
    showSidebarName(true);
  }

  /* ---------- image preview ---------- */
  var dialog = document.querySelector('.photo-dialog');
  if (dialog && typeof dialog.showModal === 'function') {
    var img = dialog.querySelector('img');
    var cap = dialog.querySelector('figcaption');
    document.querySelectorAll('.photo-button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var src = btn.querySelector('img');
        img.src = src.currentSrc || src.src;
        img.alt = src.alt;
        var fc = btn.closest('figure').querySelector('figcaption');
        cap.textContent = fc ? fc.innerText : '';
        dialog.showModal();
      });
    });
    dialog.querySelector('.photo-close').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
  }
})();
