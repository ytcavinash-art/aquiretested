(async () => {
  'use strict';

  const partials = [...document.querySelectorAll('[data-partial]')];
  await Promise.all(partials.map(async (host) => {
    try {
      const response = await fetch(host.dataset.partial);
      if (!response.ok) throw new Error('Partial unavailable');
      host.outerHTML = await response.text();
    } catch {
      host.remove();
    }
  }));

  const groups = {
    'about-menu': [
      ['About Us', 'about.html'],
      ['Vision & Mission', 'vision.html'],
      ['Our Leadership Team', 'leadership.html'],
      ['Our Core Values', 'core-values.html'],
      ['Our Goals', 'goals.html'],
    ],
    'services-menu': [
      ['Tenant Management', 'tenant-management.html'],
      ['Liaisoning', 'liaisoning.html'],
      ['IEC Activities', 'iec-activities.html'],
      ['Facility Management', 'facility-management.html'],
    ],
    'gallery-menu': [
      ['ANJ Group of Companies', 'gallery.html#anj-group'],
      ['Avenue Landmark Realty', 'gallery.html#avenue-landmark-realty'],
      ['Navbharat Mega Developers', 'gallery.html#navbharat-mega-developers'],
      ['Tata Projects', 'gallery.html#tata-projects'],
      ['L&T Realty', 'gallery.html#l-and-t-realty'],
    ],
  };

  const closeDropdowns = (except) => {
    document.querySelectorAll('.static-dropdown').forEach((menu) => {
      if (menu !== except) menu.hidden = true;
    });
    document.querySelectorAll('[aria-controls$="-menu"]').forEach((button) => {
      if (button.getAttribute('aria-controls') !== except?.id) button.setAttribute('aria-expanded', 'false');
    });
  };

  Object.entries(groups).forEach(([id, links]) => {
    const button = document.querySelector(`[aria-controls="${id}"]`);
    if (!button) return;
    const parent = button.closest('.relative');
    const menu = document.createElement('div');
    menu.id = id;
    menu.className = 'static-dropdown';
    menu.setAttribute('role', 'menu');
    menu.hidden = true;
    menu.innerHTML = links.map(([label, href]) => `<a role="menuitem" href="${href}">${label}</a>`).join('');
    parent?.append(menu);
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const willOpen = menu.hidden;
      closeDropdowns(menu);
      menu.hidden = !willOpen;
      button.setAttribute('aria-expanded', String(willOpen));
    });
    parent?.addEventListener('mouseenter', () => {
      if (matchMedia('(hover: hover)').matches) {
        closeDropdowns(menu);
        menu.hidden = false;
        button.setAttribute('aria-expanded', 'true');
      }
    });
    parent?.addEventListener('mouseleave', () => {
      if (matchMedia('(hover: hover)').matches) {
        menu.hidden = true;
        button.setAttribute('aria-expanded', 'false');
      }
    });
  });

  const mobileButton = document.querySelector('[aria-controls="mobile-menu"]');
  if (mobileButton) {
    const menu = document.createElement('div');
    menu.id = 'mobile-menu';
    menu.className = 'static-mobile-menu';
    menu.setAttribute('role', 'dialog');
    menu.setAttribute('aria-modal', 'true');
    menu.setAttribute('aria-label', 'Navigation menu');
    menu.hidden = true;
    menu.innerHTML = `
      <nav aria-label="Mobile navigation">
        <a href="index.html">Home</a>
        <p class="static-mobile-heading">About</p>
        ${groups['about-menu'].map(([label, href]) => `<a href="${href}">${label}</a>`).join('')}
        <p class="static-mobile-heading">Services</p>
        ${groups['services-menu'].map(([label, href]) => `<a href="${href}">${label}</a>`).join('')}
        <p class="static-mobile-heading">Gallery</p>
        ${groups['gallery-menu'].map(([label, href]) => `<a href="${href}">${label}</a>`).join('')}
        <p class="static-mobile-heading">More</p>
        <a href="news.html">News</a>
        <a href="contact.html">Contact</a>
        <select aria-label="Website language">
          <option value="en">English</option>
          <option value="hi">हिन्दी</option>
          <option value="mr">मराठी</option>
        </select>
      </nav>`;
    document.querySelector('header')?.append(menu);

    const setOpen = (open) => {
      menu.hidden = !open;
      mobileButton.setAttribute('aria-expanded', String(open));
      mobileButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.classList.toggle('menu-open', open);
      if (open) menu.querySelector('a')?.focus();
    };
    mobileButton.addEventListener('click', () => setOpen(menu.hidden));
    menu.addEventListener('click', (event) => {
      if (event.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setOpen(false);
    });
  }

  const searchButton = document.querySelector('header [aria-label="Open search"]');
  if (searchButton) {
    const panel = document.createElement('form');
    panel.className = 'static-search';
    panel.setAttribute('role', 'search');
    panel.hidden = true;
    panel.innerHTML = '<label class="sr-only" for="static-site-search">Search the website</label><input id="static-site-search" type="search" placeholder="Type your requirement">';
    searchButton.closest('form')?.append(panel);
    searchButton.addEventListener('click', () => {
      panel.hidden = !panel.hidden;
      if (!panel.hidden) panel.querySelector('input')?.focus();
    });
    panel.addEventListener('submit', (event) => {
      event.preventDefault();
      const query = panel.querySelector('input').value.toLowerCase();
      const targets = [
        ['tenant', 'tenant-management.html'], ['liaison', 'liaisoning.html'],
        ['iec', 'iec-activities.html'], ['facility', 'facility-management.html'],
        ['service', 'services.html'], ['about', 'about.html'], ['news', 'news.html'],
        ['blog', 'blog.html'], ['contact', 'contact.html'], ['career', 'careers.html'],
      ];
      location.href = targets.find(([term]) => query.includes(term))?.[1] || 'services.html';
    });
  }

  const cookieDomains = () => {
    const host = location.hostname;
    const parts = host.split('.');
    const root = parts.length >= 2 ? parts.slice(-2).join('.') : '';
    return [...new Set([host, `.${host}`, root, root && `.${root}`].filter(Boolean))];
  };

  const setLanguage = (language) => {
    if (language === 'en') {
      const expired = 'googtrans=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      document.cookie = expired;
      cookieDomains().forEach((domain) => { document.cookie = `${expired}; domain=${domain}`; });
      location.reload();
      return;
    }
    const value = `/en/${language}`;
    document.cookie = `googtrans=${value}; path=/; max-age=31536000; SameSite=Lax`;
    cookieDomains().forEach((domain) => {
      document.cookie = `googtrans=${value}; path=/; domain=${domain}; max-age=31536000; SameSite=Lax`;
    });
    location.reload();
  };

  document.querySelectorAll('select[aria-label="Website language"]').forEach((select) => {
    const match = document.cookie.match(/googtrans=\/en\/(en|hi|mr)/);
    select.value = match?.[1] || 'en';
    select.addEventListener('change', () => setLanguage(select.value));
  });

  window.googleTranslateElementInit = () => {
    if (!window.google?.translate?.TranslateElement) return;
    let host = document.getElementById('google_translate_element');
    if (!host) {
      host = document.createElement('div');
      host.id = 'google_translate_element';
      host.hidden = true;
      document.body.append(host);
    }
    new window.google.translate.TranslateElement({
      pageLanguage: 'en',
      includedLanguages: 'en,hi,mr',
      autoDisplay: false,
    }, host.id);
  };
  const translateScript = document.createElement('script');
  translateScript.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  translateScript.async = true;
  document.head.append(translateScript);

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.static-dropdown, [aria-controls$="-menu"]')) closeDropdowns();
  });
})();
