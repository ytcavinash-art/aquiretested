(() => {
  'use strict';

  document.querySelectorAll('[aria-label="Previous services"]').forEach((previousButton) => {
    const controls = previousButton.parentElement;
    const section = previousButton.closest('section');
    const slider = section?.querySelector('.overflow-x-auto');
    const nextButton = controls?.querySelector('[aria-label="Next services"]');
    if (!slider || !nextButton) return;

    const move = (direction) => slider.scrollBy({
      left: direction * Math.min(360, slider.clientWidth * 0.9),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
    previousButton.addEventListener('click', () => move(-1));
    nextButton.addEventListener('click', () => move(1));
  });
})();
