(() => {
  'use strict';

  const section = document.querySelector('main section[aria-label="Latest news articles"]');
  if (!section) return;

  const filters = ['All', 'SRA', 'MHADA', 'Dharavi', 'Redevelopment', 'Real Estate'];
  const state = {
    articles: [],
    page: 1,
    nextPage: undefined,
    query: '',
    filter: 'All',
    loading: false,
    error: '',
  };

  section.innerHTML = `
    <div>
      <h2 class="mb-8 text-4xl font-bold text-navy">Latest Mumbai Redevelopment News</h2>
      <label for="news-search" class="sr-only">Search redevelopment news</label>
      <input id="news-search" type="search" placeholder="Search redevelopment news..." class="mb-8 w-full rounded-xl border p-4">
      <div class="mb-8 flex flex-wrap gap-3" aria-label="Filter news by topic">
        ${filters.map((filter) => `<button type="button" aria-pressed="${filter === 'All'}" class="rounded-full border px-4 py-2 text-sm font-semibold transition">${filter}</button>`).join('')}
      </div>
      <p data-news-status role="status" class="mb-6 text-sm font-semibold text-slate-500">Loading the latest articles…</p>
      <div data-news-grid class="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3"></div>
      <div class="mt-10 text-center">
        <button data-news-more type="button" class="rounded-md bg-navy px-6 py-3 font-semibold text-white" hidden>Load more</button>
      </div>
    </div>`;

  const search = section.querySelector('#news-search');
  const filterButtons = [...section.querySelectorAll('[aria-label="Filter news by topic"] button')];
  const grid = section.querySelector('[data-news-grid]');
  const status = section.querySelector('[data-news-status]');
  const moreButton = section.querySelector('[data-news-more]');

  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[character]);

  const safeUrl = (value, fallback = '#') => {
    try {
      const url = new URL(value, window.location.href);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : fallback;
    } catch {
      return fallback;
    }
  };

  const inferCategory = (article) => {
    const text = `${article.title || ''} ${article.description || ''}`.toLowerCase();
    if (text.includes('dharavi')) return 'Dharavi';
    if (text.includes('mhada')) return 'MHADA';
    if (text.includes('slum') || text.includes('rehabilitation')) return 'Slum Rehabilitation';
    if (text.includes('sra')) return 'SRA';
    if (text.includes('real estate') || text.includes('property')) return 'Real Estate';
    return 'Redevelopment';
  };

  const formatDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? 'Date unavailable'
      : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const visibleArticles = () => {
    const query = state.query.toLowerCase();
    return state.articles.filter((article) => {
      const text = `${article.title || ''} ${article.description || ''} ${article.source || ''}`.toLowerCase();
      return (!query || text.includes(query))
        && (state.filter === 'All' || text.includes(state.filter.toLowerCase()));
    });
  };

  const attachCardActions = () => {
    grid.querySelectorAll('[data-bookmark]').forEach((button) => {
      const key = `am-news-bookmark:${button.dataset.bookmark}`;
      const update = () => {
        const active = localStorage.getItem(key) === 'true';
        button.setAttribute('aria-pressed', String(active));
        button.textContent = active ? '★' : '☆';
      };
      update();
      button.addEventListener('click', () => {
        localStorage.setItem(key, String(localStorage.getItem(key) !== 'true'));
        update();
      });
    });

    grid.querySelectorAll('[data-share]').forEach((button) => {
      button.addEventListener('click', async () => {
        const url = button.dataset.share;
        try {
          if (navigator.share) await navigator.share({ url });
          else await navigator.clipboard.writeText(url);
          button.textContent = '✓';
          window.setTimeout(() => { button.textContent = '↗'; }, 1800);
        } catch {
          // A cancelled native share dialog does not require an error message.
        }
      });
    });
  };

  const render = () => {
    const articles = visibleArticles();
    grid.innerHTML = articles.map((article) => {
      const articleUrl = safeUrl(article.url);
      const imageUrl = safeUrl(article.imageUrl || article.image, '/images/hero-poster.jpg');
      const category = inferCategory(article);
      const wordCount = `${article.title || ''} ${article.description || ''}`.trim().split(/\s+/).length;
      const readTime = Math.max(1, Math.ceil(wordCount / 180));
      return `
        <article class="group flex h-full flex-col overflow-hidden border border-slate-200 bg-white text-slate-900 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
          <div class="relative h-60 overflow-hidden bg-slate-100">
            <img loading="lazy" decoding="async" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(article.title || '')}" class="h-full w-full object-cover transition duration-700 group-hover:scale-110">
            <span class="absolute left-4 top-4 rounded-full bg-crimson px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white">${escapeHtml(category)}</span>
            <div class="absolute right-4 top-4 flex gap-2">
              <button type="button" data-bookmark="${escapeHtml(articleUrl)}" aria-label="Bookmark ${escapeHtml(article.title || 'article')}" class="grid h-9 w-9 place-items-center rounded-full bg-white text-navy shadow-lg">☆</button>
              <button type="button" data-share="${escapeHtml(articleUrl)}" aria-label="Share ${escapeHtml(article.title || 'article')}" class="grid h-9 w-9 place-items-center rounded-full bg-white text-navy shadow-lg">↗</button>
            </div>
          </div>
          <div class="flex flex-1 flex-col p-6">
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Source: ${escapeHtml(article.source || 'Google News')}</p>
            <h3 class="mt-3 line-clamp-2 text-xl font-bold leading-snug text-navy">${escapeHtml(article.title || 'Untitled article')}</h3>
            <p class="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">${escapeHtml(article.description || '')}</p>
            <div class="mt-auto flex items-center justify-between gap-4 border-t border-slate-100 pt-5">
              <time datetime="${escapeHtml(article.publishedAt || '')}" class="text-xs text-slate-500">${escapeHtml(formatDate(article.publishedAt))} · ${readTime} min</time>
              <a href="${escapeHtml(articleUrl)}" target="_blank" rel="noopener noreferrer" class="text-sm font-bold text-navy hover:text-crimson">Read Article ↗</a>
            </div>
          </div>
        </article>`;
    }).join('');

    status.textContent = state.loading
      ? 'Loading the latest articles…'
      : state.error
        ? state.error
      : articles.length
        ? `Showing ${articles.length} article${articles.length === 1 ? '' : 's'}`
        : 'No news found for this search.';
    moreButton.hidden = !state.nextPage || state.loading;
    attachCardActions();
  };

  const fetchPage = async (page) => {
    if (state.loading) return;
    state.loading = true;
    state.error = '';
    render();
    try {
      let response = await fetch(`/api/news?page=${page}`);
      if (!response.ok) {
        response = await fetch(`https://aquiretested-2.onrender.com/api/news?page=${page}`);
      }
      if (!response.ok) throw new Error('Unable to load news');
      const payload = await response.json();
      const articles = payload.articles || payload.news || payload.items || [];
      const known = new Set(state.articles.map((article) => article.url));
      state.articles.push(...articles.filter((article) => !known.has(article.url)));
      state.nextPage = payload.nextPage;
      state.page = page;
    } catch {
      state.error = state.articles.length
        ? 'More articles could not be loaded.'
        : 'Live news is temporarily unavailable. Please try again shortly.';
    } finally {
      state.loading = false;
      render();
    }
  };

  search.addEventListener('input', () => {
    state.query = search.value.trim();
    render();
  });
  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      state.filter = button.textContent.trim();
      filterButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      render();
    });
  });
  moreButton.addEventListener('click', () => fetchPage(state.nextPage));
  fetchPage(1);
})();
