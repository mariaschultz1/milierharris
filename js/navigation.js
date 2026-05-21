// Mobile menu + current-page highlight.

const nav = document.querySelector('.nav');
const burger = nav?.querySelector('.nav__burger');

function setOpen(open) {
  if (!nav) return;
  nav.classList.toggle('is-open', open);
  document.body.style.overflow = open ? 'hidden' : '';
}

burger?.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));

window.addEventListener('resize', () => {
  if (window.innerWidth > 880 && nav?.classList.contains('is-open')) setOpen(false);
});

// Mark the current page in the menu.
const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
document.querySelectorAll('[data-nav]').forEach((a) => {
  const target = a.dataset.nav?.toLowerCase();
  if (target === page || (page === '' && target === 'index.html')) {
    a.classList.add('is-active');
  }
});
