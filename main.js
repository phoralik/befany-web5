/* ============================================================
   BEFANY — Dentální Studio Slavičín
   Main JavaScript — Navigation, Scroll, Animations
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // ===== ISLAND NAV — Scroll state =====
  const nav = document.getElementById('islandNav');
  let lastScroll = 0;

  const handleScroll = () => {
    const scrollY = window.scrollY;

    if (scrollY > 60) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }

    lastScroll = scrollY;
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // Initial check


  // ===== MOBILE MENU =====
  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  if (navToggle && mobileMenu) {
  navToggle.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    navToggle.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close mobile menu on link click
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      navToggle.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
  }


  // ===== SMOOTH SCROLL =====
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      const navHeight = nav.offsetHeight + 24;
      const targetPos = target.getBoundingClientRect().top + window.scrollY - navHeight;

      window.scrollTo({
        top: targetPos,
        behavior: 'smooth'
      });
    });
  });


  // ===== ACTIVE NAV LINK =====
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  const updateActiveLink = () => {
    const scrollPos = window.scrollY + 120;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  };

  window.addEventListener('scroll', updateActiveLink, { passive: true });
  updateActiveLink();


  // ===== SCROLL REVEAL =====
  const revealElements = document.querySelectorAll('.reveal');

  // Set stagger index for team cards
  document.querySelectorAll('.team-grid .reveal').forEach((el, i) => {
    el.style.setProperty('--i', i);
    el.style.transitionDelay = `${i * 50}ms`;
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));


  // ===== CONTACT FORM =====
  // Zprávy doručuje Web3Forms na info@befany.cz (web je statický, vlastní server nemá).
  // Klíč se vyzvedává na web3forms.com zadáním info@befany.cz, přijde do té schránky.
  // Klíč není tajný, jen říká, kam zprávu doručit.
  // Dokud je prázdný, formulář nic nepředstírá a nabídne telefon.
  const WEB3FORMS_KEY = '6256e0ec-64d5-4db0-a753-191f4940a482';
  const form = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');

  const showStatus = (text, ok) => {
    formStatus.textContent = text;
    formStatus.classList.toggle('is-ok', ok);
    formStatus.classList.toggle('is-error', !ok);
    formStatus.hidden = false;
  };

  const ERROR_TEXT = 'Zprávu se nepodařilo odeslat. Zavolejte nám prosím na +420 771 167 069 nebo napište na info@befany.cz.';

  if (form) form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    formStatus.hidden = true;

    if (!WEB3FORMS_KEY) {
      showStatus(ERROR_TEXT, false);
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Odesílám…';

    const data = Object.fromEntries(new FormData(form));
    data.access_key = WEB3FORMS_KEY;
    data.subject = 'Nová zpráva z webu befany.cz: ' + (data.name || '');
    data.from_name = 'Web Befany';
    data.botcheck = form.querySelector('[name="botcheck"]').checked;

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.message || 'HTTP ' + res.status);
      form.reset();
      showStatus('Děkujeme, zpráva odešla. Ozveme se Vám co nejdříve.', true);
    } catch (err) {
      showStatus(ERROR_TEXT, false);
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  });


  // ===== AKTUALITY Z GOOGLE TABULKY =====
  // Tabulka „Befany web · aktuality“, list „Aktuality“: Od | Do | Nadpis | Text.
  // Lenka ji spravuje sama, oznámení se ukáže v den Od a po dni Do samo zmizí.
  // Vzor převzatý z mudrgott.cz (gviz JSON, ověřený na produkci).
  // Když se tabulka nenačte nebo nesedí hlavička, aktuality zůstanou skryté.
  const AKTUALITY_SHEET_ID = '1wA2-r8BWpKLWl66Hqm05axb0W5weD1rywMGjfWlB2PE';
  const AKTUALITY_LIST = 'Aktuality';
  const AKTUALITY_MAX = 2;

  // headers=0: gviz jinak hádá počet hlavičkových řádků podle typu sloupců.
  const aktualityUrl = 'https://docs.google.com/spreadsheets/d/' + AKTUALITY_SHEET_ID +
    '/gviz/tq?tqx=out:json&headers=0&sheet=' + encodeURIComponent(AKTUALITY_LIST);

  // Buňka → datum. Primárně Date(rok,měsíc od nuly,den) od Googlu, jinak ruční zápis.
  const bunkaNaDatum = (cell) => {
    if (!cell || cell.v === null || cell.v === undefined) return null;
    const v = String(cell.v).trim();
    const g = v.match(/^Date\((\d{4}),(\d{1,2}),(\d{1,2})/);
    if (g) return new Date(+g[1], +g[2], +g[3]);
    const iso = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
    const cz = v.match(/^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})$/);
    if (cz) return new Date(+cz[3], +cz[2] - 1, +cz[1]);
    return null;
  };

  const bunkaNaText = (cell) => (cell && cell.v !== null && cell.v !== undefined) ? String(cell.v).trim() : '';

  // Pevné mezery za jednopísmennými předložkami, Lenka typografii řešit nemusí.
  const svazPredlozky = (s) => {
    for (let i = 0; i < 2; i++) {
      s = s.replace(/(^|[\s(„"])([kszvouaiKSZVOUAI]) /g, '$1$2 ');
    }
    s = s.replace(/\+?\d{3}(?: \d{3}){2,3}(?!\d)/g, (m) => m.replace(/ /g, ' '));
    s = s.replace(/(\d{1,2}\.) (\d{1,2}\.) (\d{4})/g, '$1 $2 $3');
    return s;
  };

  // gviz při neznámém názvu listu tiše vrátí PRVNÍ list. Bez shody hlavičky nezobrazit nic.
  // Buňky Od a Do se nekontrolují: sloupec s datem vrací textovou hlavičku prázdnou.
  const jeListAktualit = (radky) => radky.some((c) =>
    bunkaNaText(c[2]).toLowerCase() === 'nadpis' && bunkaNaText(c[3]).toLowerCase() === 'text');

  const aktualityBox = document.getElementById('aktuality');
  if (aktualityBox) {
    fetch(aktualityUrl, { cache: 'no-cache' })
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error('HTTP ' + r.status))))
      .then((txt) => {
        const json = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1));
        const radky = ((json.table && json.table.rows) || []).map((row) => row.c || []);
        if (!jeListAktualit(radky)) return;

        const dnes = new Date();
        dnes.setHours(0, 0, 0, 0);
        const platne = [];
        for (const c of radky) {
          const od = bunkaNaDatum(c[0]);
          const doKdy = bunkaNaDatum(c[1]);
          const nadpis = bunkaNaText(c[2]);
          const text = bunkaNaText(c[3]);
          if (!od || !doKdy || !nadpis || !text) continue;
          doKdy.setHours(23, 59, 59, 999);
          if (dnes < od || dnes > doKdy) continue;
          platne.push({ nadpis: nadpis.replace(/\s*:\s*$/, ''), text });
          if (platne.length === AKTUALITY_MAX) break;
        }
        if (!platne.length) return;

        // Jen textContent, nikdy innerHTML: text píše člověk do tabulky.
        const items = aktualityBox.querySelector('.aktuality-items');
        platne.forEach((a, i) => {
          if (i > 0) {
            const div = document.createElement('div');
            div.className = 'aktuality-divider';
            items.appendChild(div);
          }
          const item = document.createElement('div');
          item.className = 'aktuality-item';
          if (i === 0) {
            const badge = document.createElement('span');
            badge.className = 'aktuality-badge';
            badge.textContent = 'Nové';
            item.appendChild(badge);
          }
          const p = document.createElement('p');
          const strong = document.createElement('strong');
          strong.textContent = svazPredlozky(a.nadpis) + ':';
          p.appendChild(strong);
          p.appendChild(document.createTextNode(' ' + svazPredlozky(a.text)));
          item.appendChild(p);
          items.appendChild(item);
        });
        aktualityBox.hidden = false;
        document.querySelectorAll('.nav-aktuality').forEach((a) => { a.hidden = false; });
      })
      .catch(() => {});
  }

});
