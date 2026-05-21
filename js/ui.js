// Small bits of UI that don't justify their own module:
// counter animation, careers disclosure, form mock, year stamp.

// --- counters ----------------------------------------------------------------

function runCounter(el) {
  if (el.dataset.counted === 'done') return;
  el.dataset.counted = 'done';

  const target = parseFloat(el.dataset.counter);
  if (Number.isNaN(target)) return;

  const decimals = (el.dataset.counter.split('.')[1] || '').length;
  const duration = parseInt(el.dataset.counterMs, 10) || 1400;
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  const start = performance.now();

  const step = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const value = target * eased;
    el.textContent = prefix + value.toFixed(decimals) + suffix;
    if (t < 1) requestAnimationFrame(step);
    else el.textContent = prefix + (decimals ? target.toFixed(decimals) : String(target)) + suffix;
  };
  requestAnimationFrame(step);
}

const counters = document.querySelectorAll('[data-counter]');
if (counters.length) {
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          runCounter(e.target);
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    counters.forEach((el) => io.observe(el));

    // Fallback sweep — some preview iframes never tick the observer.
    setTimeout(() => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      counters.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < vh && r.bottom > 0) runCounter(el);
      });
    }, 800);
  } else {
    counters.forEach(runCounter);
  }
}

// --- careers role disclosure -------------------------------------------------

document.querySelectorAll('.disclosure').forEach((d) => {
  const head = d.querySelector('.disclosure__head');
  head?.addEventListener('click', () => d.classList.toggle('is-open'));
});

// --- mock form submission ----------------------------------------------------

document.querySelectorAll('form[data-mock]').forEach((form) => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    form.classList.add('is-sent');
  });

  form.querySelectorAll('input[type=file]').forEach((input) => {
    input.addEventListener('change', () => {
      const label = input.parentElement.querySelector('.dropper__text');
      if (!label) return;
      label.textContent = input.files?.[0]?.name || label.dataset.placeholder || 'Attach file';
    });
  });
});

// --- footer year stamp -------------------------------------------------------

document.querySelectorAll('[data-year]').forEach((el) => {
  el.textContent = new Date().getFullYear();
});
