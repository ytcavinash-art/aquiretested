(() => {
  'use strict';

  const CONTACT_API = 'https://aquiretested-2.onrender.com/api/contact';
  const FEEDBACK_API = 'https://aquiretested-2.onrender.com/api/feedback';

  const showStatus = (form, message, isError = false) => {
    form.querySelector('[data-form-status]')?.remove();
    const status = document.createElement('p');
    status.dataset.formStatus = '';
    status.setAttribute('role', isError ? 'alert' : 'status');
    status.className = `text-sm font-semibold ${isError ? 'text-red-600' : 'text-emerald-700'}`;
    status.textContent = message;
    form.prepend(status);
  };

  document.querySelectorAll('input[type="tel"][maxlength="10"]').forEach((input) => {
    input.addEventListener('input', () => {
      input.value = input.value.replace(/\D/g, '').slice(0, 10);
    });
  });

  document.querySelectorAll('#quick-phone').forEach((phoneInput) => {
    const form = phoneInput.closest('form');
    if (!form) return;
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const submit = form.querySelector('[type="submit"]');
      const original = submit?.textContent;
      if (submit) {
        submit.disabled = true;
        submit.textContent = 'Sending…';
      }
      try {
        const response = await fetch(CONTACT_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.fromEntries(new FormData(form))),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || 'Submission failed');
        form.reset();
        showStatus(form, 'Thank you. Your enquiry has been received.');
      } catch {
        showStatus(form, 'Submission failed. Please call or email us directly.', true);
      } finally {
        if (submit) {
          submit.disabled = false;
          submit.textContent = original;
        }
      }
    });
  });

  const feedbackName = document.getElementById('feedback-name');
  const feedbackForm = feedbackName?.closest('form');
  if (feedbackForm) {
    const feedbackEmail = document.getElementById('feedback-email');
    const feedbackMessage = document.getElementById('feedback-message');
    const stars = [...feedbackForm.querySelectorAll('[aria-label^="Rate "]')];
    let rating = 5;
    feedbackName.name = 'fullName';
    feedbackEmail.name = 'emailAddress';
    feedbackMessage.name = 'feedback';

    const setRating = (nextRating) => {
      rating = nextRating;
      stars.forEach((star, index) => {
        const selected = index < nextRating;
        star.setAttribute('aria-pressed', String(index + 1 === nextRating));
        star.classList.toggle('static-rating-dim', !selected);
      });
    };
    stars.forEach((star, index) => star.addEventListener('click', () => setRating(index + 1)));
    setRating(5);

    feedbackForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!feedbackForm.reportValidity()) return;
      const submit = feedbackForm.querySelector('[type="submit"]');
      const original = submit?.textContent;
      if (submit) {
        submit.disabled = true;
        submit.textContent = 'Submitting…';
      }
      try {
        const response = await fetch(FEEDBACK_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: feedbackName.value.trim(),
            emailAddress: feedbackEmail.value.trim(),
            rating,
            feedback: feedbackMessage.value.trim(),
          }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || 'Feedback could not be submitted');
        feedbackForm.reset();
        setRating(5);
        showStatus(feedbackForm, 'Thank you for your feedback!');
        window.dispatchEvent(new Event('feedback-submitted'));
      } catch {
        showStatus(feedbackForm, 'Feedback could not be submitted. Please try again.', true);
      } finally {
        if (submit) {
          submit.disabled = false;
          submit.textContent = original;
        }
      }
    });
  }

  const reviewsSection = document.getElementById('testimonials');
  if (reviewsSection) {
    const wrapper = reviewsSection.querySelector('.mx-auto.max-w-7xl');
    const heading = wrapper?.firstElementChild;
    let activeIndex = 0;
    let reviews = [];

    const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    })[character]);

    const render = () => {
      wrapper.querySelector('[data-static-reviews]')?.remove();
      const host = document.createElement('div');
      host.dataset.staticReviews = '';
      if (!reviews.length) {
        host.className = 'border border-slate-200 bg-white px-6 py-14 text-center shadow-sm';
        host.innerHTML = '<h3 class="text-xl font-bold text-navy">Your experience can be the first</h3><p class="mt-2 text-sm text-slate-500">Share your feedback using the form below.</p>';
        wrapper.append(host);
        return;
      }

      const visible = [0, 1, 2].map((offset) => reviews[(activeIndex + offset) % reviews.length]);
      host.innerHTML = `
        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          ${visible.map((review, position) => {
            const rating = Math.min(5, Math.max(1, Math.round(Number(review.rating) || 5)));
            const initials = String(review.fullName || 'Client').split(/\s+/).slice(0, 2)
              .map((part) => part.charAt(0)).join('').toUpperCase();
            const date = new Date(review.createdAt);
            const dateText = Number.isNaN(date.getTime())
              ? ''
              : date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
            const responsive = position === 2 ? ' hidden lg:flex' : position === 1 ? ' hidden md:flex' : '';
            return `<article class="flex min-h-72 flex-col border bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg${responsive}">
              <div class="text-amber-400" aria-label="${rating} out of 5 stars">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</div>
              <blockquote class="mt-6 flex-1 text-base leading-7 text-slate-600">“${escapeHtml(review.feedback)}”</blockquote>
              <div class="mt-7 flex items-center gap-3 border-t border-slate-100 pt-5">
                <span class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-navy text-xs font-bold text-white" aria-hidden="true">${escapeHtml(initials || 'CL')}</span>
                <div><h3 class="text-sm font-bold text-navy">${escapeHtml(review.fullName || 'Client')}</h3><time class="mt-1 block text-[10px] uppercase tracking-wider text-slate-400">${escapeHtml(dateText)}</time></div>
              </div>
            </article>`;
          }).join('')}
        </div>
        ${reviews.length > 1 ? `<div class="mt-8 flex items-center justify-center gap-4">
          <button type="button" data-review-move="-1" aria-label="Previous reviews" class="grid h-11 w-11 place-items-center rounded-full border border-slate-300 bg-white text-navy">←</button>
          <p class="min-w-16 text-center text-xs font-bold text-slate-500">${activeIndex + 1} / ${reviews.length}</p>
          <button type="button" data-review-move="1" aria-label="Next reviews" class="grid h-11 w-11 place-items-center rounded-full border border-slate-300 bg-white text-navy">→</button>
        </div>` : ''}`;
      host.querySelectorAll('[data-review-move]').forEach((button) => {
        button.addEventListener('click', () => {
          activeIndex = (activeIndex + Number(button.dataset.reviewMove) + reviews.length) % reviews.length;
          render();
        });
      });
      wrapper.append(host);
    };

    const loadReviews = async () => {
      try {
        const response = await fetch(FEEDBACK_API);
        if (!response.ok) throw new Error('Reviews unavailable');
        const data = await response.json();
        reviews = Array.isArray(data) ? data : [];
        activeIndex = 0;
        [...wrapper.children].forEach((child) => {
          if (child !== heading && !child.hasAttribute('data-static-reviews')) child.remove();
        });
        render();
      } catch {
        // Keep the server-rendered reviews visible when the API is temporarily unavailable.
      }
    };
    loadReviews();
    window.addEventListener('feedback-submitted', loadReviews);
  }
})();
