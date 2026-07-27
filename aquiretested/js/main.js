(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  const scrollButton = document.querySelector('[aria-label="Scroll to key statistics"]');
  scrollButton?.addEventListener('click', () => {
    document.getElementById('hero-statistics')?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  });

  if ('IntersectionObserver' in window && !reduceMotion) {
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        currentObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('main section, main article').forEach((element) => observer.observe(element));
  }

  const statistics = document.getElementById('hero-statistics');
  if (statistics) {
    const animateCounters = () => {
      statistics.querySelectorAll('[aria-label]').forEach((counter) => {
        const match = counter.getAttribute('aria-label')?.match(/^([\d,]+)(.*)$/);
        const output = counter.querySelector('[aria-hidden="true"]');
        if (!match || !output) return;
        const finalValue = Number(match[1].replaceAll(',', ''));
        const suffix = match[2];
        if (reduceMotion) {
          output.textContent = `${finalValue.toLocaleString('en-IN')}${suffix}`;
          return;
        }
        const start = performance.now();
        const update = (now) => {
          const progress = Math.min((now - start) / 1600, 1);
          const value = Math.round(finalValue * (1 - Math.pow(1 - progress, 3)));
          output.textContent = `${value.toLocaleString('en-IN')}${suffix}`;
          if (progress < 1) requestAnimationFrame(update);
        };
        requestAnimationFrame(update);
      });
    };

    if ('IntersectionObserver' in window) {
      const counterObserver = new IntersectionObserver((entries, observer) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        animateCounters();
        observer.disconnect();
      }, { threshold: 0.5 });
      counterObserver.observe(statistics);
    } else {
      animateCounters();
    }
  }

  // Filter the server-rendered FAQ entries without rebuilding their accessible details markup.
  document.querySelectorAll('#faq').forEach((faq) => {
    const search = faq.querySelector('#faq-search');
    const filterGroup = faq.querySelector('[aria-label="Filter FAQs by category"]');
    const filters = [...(filterGroup?.querySelectorAll('button') || [])];
    const entries = [...faq.querySelectorAll('details')];
    const resultCount = [...faq.querySelectorAll('[aria-live="polite"]')]
      .find((element) => /Showing \d+/i.test(element.textContent));
    if (!search || !filters.length || !entries.length) return;
    let activeCategory = 'All';

    const update = () => {
      const query = search.value.trim().toLowerCase();
      let visible = 0;
      entries.forEach((entry) => {
        const category = entry.querySelector('summary span span')?.textContent.trim() || '';
        const matchesCategory = activeCategory === 'All' || category === activeCategory;
        const matchesQuery = !query || entry.textContent.toLowerCase().includes(query);
        entry.hidden = !(matchesCategory && matchesQuery);
        if (!entry.hidden) visible += 1;
      });
      if (resultCount) resultCount.textContent = `Showing ${visible} ${visible === 1 ? 'answer' : 'answers'}`;
    };

    filters.forEach((button) => {
      button.addEventListener('click', () => {
        activeCategory = button.textContent.trim();
        filters.forEach((item) => {
          const active = item === button;
          item.setAttribute('aria-pressed', String(active));
          item.classList.toggle('border-navy', active);
          item.classList.toggle('bg-navy', active);
          item.classList.toggle('text-white', active);
        });
        update();
      });
    });
    search.addEventListener('input', update);
  });

  // Blog cards are already useful without JavaScript; filtering is a progressive enhancement.
  const blogSearch = document.getElementById('blog-search');
  if (blogSearch) {
    const section = blogSearch.closest('section');
    const filterGroup = section?.querySelector('[aria-label="Filter articles by category"]');
    const filters = [...(filterGroup?.querySelectorAll('button') || [])];
    const contentGrid = section?.querySelector('.grid.gap-9');
    const articleColumn = contentGrid?.firstElementChild;
    const articles = [...(articleColumn?.querySelectorAll('article') || [])];
    let activeCategory = 'All';

    const updateBlog = () => {
      const query = blogSearch.value.trim().toLowerCase();
      articles.forEach((article) => {
        const category = article.querySelector('p')?.textContent.trim() || '';
        article.hidden = !(
          (activeCategory === 'All' || category === activeCategory)
          && (!query || article.textContent.toLowerCase().includes(query))
        );
      });
    };

    filters.forEach((button) => {
      button.addEventListener('click', () => {
        activeCategory = button.textContent.trim();
        filters.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
        updateBlog();
      });
    });
    blogSearch.addEventListener('input', updateBlog);
  }

  document.querySelectorAll('input[id^="newsletter-email"]').forEach((email) => {
    const form = email.closest('form');
    if (!form) return;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const subject = encodeURIComponent('A&M Advisory newsletter subscription');
      const body = encodeURIComponent(`Please add ${email.value.trim()} to the A&M Advisory newsletter.`);
      window.location.href = `mailto:info@aquireandmanage.com?subject=${subject}&body=${body}`;
    });
  });

  const serviceContactButtons = [...document.querySelectorAll('main button')]
    .filter((button) => button.textContent.trim() === 'Get In Touch');
  if (serviceContactButtons.length) {
    const modal = document.createElement('section');
    modal.className = 'static-contact-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'static-contact-title');
    modal.hidden = true;
    modal.innerHTML = `
      <div class="static-contact-panel">
        <div class="static-contact-heading">
          <h2 id="static-contact-title">Get In Touch</h2>
          <button type="button" aria-label="Close contact form">×</button>
        </div>
        <form>
          <label for="static-contact-name">Full name</label>
          <input id="static-contact-name" name="fullName" required autocomplete="name">
          <label for="static-contact-phone">Mobile number</label>
          <input id="static-contact-phone" name="mobileNumber" type="tel" inputmode="numeric" pattern="[0-9]{10}" maxlength="10" required autocomplete="tel">
          <label for="static-contact-email">Email address</label>
          <input id="static-contact-email" name="emailAddress" type="email" required autocomplete="email">
          <label for="static-contact-message">Project requirement</label>
          <textarea id="static-contact-message" name="message" rows="4" required></textarea>
          <p data-modal-status aria-live="polite"></p>
          <button type="submit">Send Enquiry</button>
        </form>
      </div>`;
    document.body.append(modal);
    const form = modal.querySelector('form');
    const closeButton = modal.querySelector('[aria-label="Close contact form"]');
    const openModal = () => {
      modal.hidden = false;
      document.body.classList.add('menu-open');
      modal.querySelector('input').focus();
    };
    const closeModal = () => {
      modal.hidden = true;
      document.body.classList.remove('menu-open');
    };
    serviceContactButtons.forEach((button) => button.addEventListener('click', openModal));
    closeButton.addEventListener('click', closeModal);
    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeModal();
    });
    modal.querySelector('input[type="tel"]').addEventListener('input', (event) => {
      event.target.value = event.target.value.replace(/\D/g, '').slice(0, 10);
    });
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const submit = form.querySelector('[type="submit"]');
      const status = form.querySelector('[data-modal-status]');
      submit.disabled = true;
      status.textContent = 'Sending…';
      try {
        const response = await fetch('https://aquiretested-2.onrender.com/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.fromEntries(new FormData(form))),
        });
        if (!response.ok) throw new Error('Submission failed');
        form.reset();
        status.textContent = 'Thank you. Your enquiry has been received.';
      } catch {
        status.textContent = 'Unable to submit. Please call +91 022-45648350 or email us.';
      } finally {
        submit.disabled = false;
      }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !modal.hidden) closeModal();
    });
  }

  if (!document.querySelector('nav[aria-label="Quick contact actions"]')) {
    const actions = document.createElement('nav');
    actions.setAttribute('aria-label', 'Quick contact actions');
    actions.className = 'fixed bottom-5 right-4 z-[65] flex flex-col items-end gap-2.5 sm:bottom-6 sm:right-6';
    actions.innerHTML = `
      <button type="button" class="grid h-12 w-12 place-items-center rounded-full bg-navy text-white shadow-lg" aria-label="Open project assistant" aria-expanded="false">✦</button>
      <a href="tel:+912245648350" class="grid h-12 w-12 place-items-center rounded-full bg-crimson text-white shadow-lg" aria-label="Call A&amp;M Advisory">☎</a>
      <a href="https://wa.me/912245648350?text=Hello%20A%26M%20Advisory%2C%20I%20would%20like%20to%20discuss%20a%20redevelopment%20project." target="_blank" rel="noreferrer" class="grid h-12 w-12 place-items-center rounded-full bg-[#25D366] text-white shadow-lg" aria-label="Chat with A&amp;M Advisory on WhatsApp">●</a>`;
    document.body.append(actions);
  }

  const quickActions = document.querySelector('nav[aria-label="Quick contact actions"]');
  if (quickActions) {
    const backToTop = document.createElement('button');
    backToTop.type = 'button';
    backToTop.className = 'static-back-to-top group relative grid h-12 w-12 place-items-center rounded-full bg-slate-700 text-white shadow-lg transition duration-300 hover:-translate-y-1';
    backToTop.setAttribute('aria-label', 'Back to top');
    backToTop.innerHTML = '<span aria-hidden="true">↑</span>';
    backToTop.hidden = window.scrollY <= 600;
    quickActions.prepend(backToTop);
    backToTop.addEventListener('click', () => window.scrollTo({
      top: 0,
      behavior: reduceMotion ? 'auto' : 'smooth',
    }));
    window.addEventListener('scroll', () => {
      backToTop.hidden = window.scrollY <= 600;
    }, { passive: true });
  }

  const chatButton = document.querySelector('[aria-label="Open project assistant"]');
  if (chatButton) {
    const chat = document.createElement('section');
    chat.className = 'static-chat';
    chat.setAttribute('role', 'dialog');
    chat.setAttribute('aria-labelledby', 'static-chat-title');
    chat.hidden = true;
    chat.innerHTML = `
      <header class="static-chat-header">
        <div><strong id="static-chat-title">A&amp;M Project Assistant</strong><small>Verified knowledge guidance</small></div>
        <button type="button" aria-label="Close project assistant">×</button>
      </header>
      <div class="static-chat-messages" aria-live="polite">
        <p class="static-chat-message">Hello! I’m A&amp;M’s quick project assistant. How can I help with your redevelopment enquiry?</p>
        <div class="static-chat-suggestions">
          <button type="button">SRA kya hai?</button>
          <button type="button">Kaunse documents chahiye?</button>
          <button type="button">Timeline kitni hoti hai?</button>
          <button type="button">Eligibility kaise decide hoti hai?</button>
        </div>
      </div>
      <form class="static-chat-form">
        <label class="sr-only" for="static-chat-input">Ask the project assistant</label>
        <input id="static-chat-input" placeholder="Ask about SRA, approvals..." required>
        <button type="submit" aria-label="Send message">➤</button>
      </form>`;
    document.body.append(chat);
    const messages = chat.querySelector('.static-chat-messages');
    const conversation = [];

    const fallbackResponse = (question) => {
      const text = question.toLowerCase();
      if (text.includes('tenant') || text.includes('family') || text.includes('survey')) {
        return 'Our tenant management support covers surveys, documentation, resident coordination, rent readiness and relocation planning.';
      }
      if (text.includes('document')) return 'Common documents include identity, address, occupancy, family, bank and project-specific eligibility records.';
      if (text.includes('timeline')) return 'The timeline depends on approvals, eligibility verification, consent, shifting readiness and project execution conditions.';
      if (text.includes('eligibility')) return 'Eligibility is decided under applicable government rules and verified supporting records for the specific project.';
      if (text.includes('approval') || text.includes('sra')) return 'Our liaisoning team supports submissions, compliance documentation, authority coordination, NOCs and approval follow-ups.';
      return 'Our team can guide you on tenant management, liaisoning, IEC activities and approvals. Please use Quick Enquiry for project-specific advice.';
    };

    const appendMessage = (text, sender) => {
      const message = document.createElement('p');
      message.className = `static-chat-message${sender === 'user' ? ' user' : ''}`;
      message.textContent = text;
      messages.append(message);
      messages.scrollTop = messages.scrollHeight;
      return message;
    };

    const ask = async (question) => {
      if (!question) return;
      appendMessage(question, 'user');
      conversation.push({ role: 'user', content: question });
      const pending = appendMessage('Thinking…', 'assistant');
      try {
        const response = await fetch('https://aquiretested-2.onrender.com/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: conversation.slice(-8) }),
        });
        if (!response.ok) throw new Error('Chat service unavailable');
        const data = await response.json();
        if (!data.answer) throw new Error('Empty response');
        pending.textContent = data.answer;
        conversation.push({ role: 'assistant', content: data.answer });
      } catch {
        const answer = fallbackResponse(question);
        pending.textContent = answer;
        conversation.push({ role: 'assistant', content: answer });
      }
      messages.scrollTop = messages.scrollHeight;
    };

    const setChatOpen = (open) => {
      chat.hidden = !open;
      chatButton.setAttribute('aria-expanded', String(open));
      chatButton.setAttribute('aria-label', open ? 'Close project assistant' : 'Open project assistant');
      if (open) chat.querySelector('input').focus();
    };
    chatButton.addEventListener('click', () => setChatOpen(chat.hidden));
    chat.querySelector('[aria-label="Close project assistant"]').addEventListener('click', () => setChatOpen(false));
    chat.querySelectorAll('.static-chat-suggestions button').forEach((button) => {
      button.addEventListener('click', () => ask(button.textContent));
    });
    chat.querySelector('form').addEventListener('submit', (event) => {
      event.preventDefault();
      const input = chat.querySelector('input');
      const question = input.value.trim();
      input.value = '';
      ask(question);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !chat.hidden) setChatOpen(false);
    });
  }
})();
