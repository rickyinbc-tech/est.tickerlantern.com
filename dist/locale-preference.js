// Remembers the reader's language choice and keeps subsequent navigation in
// that language. Runs blocking in <head> so an English flash is avoided.
(function () {
  var KEY = 'tl-lang';
  var path = location.pathname;
  var isZh = path === '/zh' || path.startsWith('/zh/');
  var stored = null;
  try { stored = localStorage.getItem(KEY); } catch (error) { /* private mode */ }

  function englishPath(value) {
    if (value === '/zh' || value === '/zh/') return '/';
    return value.replace(/^\/zh(?=\/)/, '') || '/';
  }
  function chinesePath(value) {
    if (value === '/' || value === '') return '/zh/';
    if (value === '/zh' || value.startsWith('/zh/')) return value;
    return '/zh' + value;
  }
  function skip() {
    return /^\/(?:zh-locales|api|data|favicon|social|sitemap|robots)/.test(path)
      || /\.(?:css|js|json|svg|png|jpg|jpeg|webp|xml|txt|csv|pdf)$/i.test(path)
      || /[?&]nolang=1(?:&|$)/.test(location.search)
      || path === '/404' || path === '/zh/404';
  }

  if (!skip()) {
    if (stored === 'zh' && !isZh) {
      location.replace(chinesePath(path) + location.search + location.hash);
      return;
    }
    if (stored === 'en' && isZh) {
      location.replace(englishPath(path) + location.search + location.hash);
      return;
    }
  }

  document.addEventListener('click', function (event) {
    var link = event.target && event.target.closest ? event.target.closest('[data-tl-lang]') : null;
    if (!link) return;
    try { localStorage.setItem(KEY, link.getAttribute('data-tl-lang')); } catch (error) { /* private mode */ }
  }, true);
})();
