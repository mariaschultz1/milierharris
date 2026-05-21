// Cookie notice. Shows once; persists the choice in localStorage.

const KEY = 'mh-cookies';

function store(value) {
  try { localStorage.setItem(KEY, value); } catch {}
}

function read() {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

const choice = read();
if (choice !== 'accepted' && choice !== 'declined') {
  const banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Cookie notice');
  banner.innerHTML = `
    <div class="cookie-banner__inner">
      <p class="cookie-banner__text">We use a minimal set of cookies to operate this site. See our <a href="privacy.html">privacy policy</a> for details.</p>
      <div class="cookie-banner__actions">
        <button type="button" class="cookie-banner__btn cookie-banner__btn--ghost" data-cookies="declined">Decline</button>
        <button type="button" class="cookie-banner__btn cookie-banner__btn--primary" data-cookies="accepted">Accept</button>
      </div>
    </div>`;
  document.body.appendChild(banner);

  // Double-RAF so the CSS transition runs from the off state.
  requestAnimationFrame(() => requestAnimationFrame(() => banner.classList.add('is-visible')));

  banner.querySelectorAll('[data-cookies]').forEach((btn) => {
    btn.addEventListener('click', () => {
      store(btn.dataset.cookies);
      banner.classList.remove('is-visible');
      banner.classList.add('is-dismissed');
      setTimeout(() => banner.remove(), 360);
    });
  });
}
