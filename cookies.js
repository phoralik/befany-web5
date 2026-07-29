/* ============================================================
   BEFANY — Cookies consent + Google Analytics 4
   GA4 se načte POUZE po souhlasu návštěvníka.
   ============================================================ */
(function () {
  // GA4 property převzatá ze stávajícího befany.cz (ověřeno 29. 7. 2026)
  var GA_ID = 'G-1VEDWZFCCP';
  var KEY = 'befany-cookie-consent'; // 'granted' | 'denied'

  function loadGA() {
    if (GA_ID.indexOf('XXXX') !== -1) return; // ID ještě nedoplněno
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_ID, { anonymize_ip: true });
  }

  function hideBanner() {
    var el = document.getElementById('cookieBanner');
    if (el) el.remove();
  }

  function setConsent(value) {
    try { localStorage.setItem(KEY, value); } catch (e) {}
    hideBanner();
    if (value === 'granted') loadGA();
  }

  function showBanner() {
    if (document.getElementById('cookieBanner')) return;
    var el = document.createElement('div');
    el.id = 'cookieBanner';
    el.className = 'cookie-banner';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Nastavení cookies');
    el.innerHTML =
      '<div class="cookie-banner-inner">' +
      '<p>Používáme statistické cookies (Google Analytics), abychom v anonymní podobě viděli, jak web funguje. Načtou se jen s vaším souhlasem. <a href="gdpr.html">Více informací</a></p>' +
      '<div class="cookie-banner-actions">' +
      '<button type="button" class="btn btn-primary" id="cookieAccept">Povolit</button>' +
      '<button type="button" class="btn btn-outline" id="cookieDeny">Jen nezbytné</button>' +
      '</div></div>';
    document.body.appendChild(el);
    document.getElementById('cookieAccept').addEventListener('click', function () { setConsent('granted'); });
    document.getElementById('cookieDeny').addEventListener('click', function () { setConsent('denied'); });
  }

  // Odkaz „Nastavení cookies" v patičce — znovu otevře lištu
  window.befanyCookieSettings = function () {
    try { localStorage.removeItem(KEY); } catch (e) {}
    showBanner();
    return false;
  };

  var choice = null;
  try { choice = localStorage.getItem(KEY); } catch (e) {}
  if (choice === 'granted') {
    loadGA();
  } else if (choice !== 'denied') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showBanner);
    } else {
      showBanner();
    }
  }
})();
