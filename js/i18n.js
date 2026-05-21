// Dictionary-driven EN / FR swap.
// Translatable elements are picked by selector, snapshotted on first run,
// then swapped on toggle. Inline mixed-content paragraphs (with <strong>,
// <a>, <br>) are handled by descending into direct text-node children.

import { translations } from './translations.js';

const STORAGE_KEY = 'mh-lang';
const SUPPORTED = ['en', 'fr'];

// Elements that own a translatable string.
const TEXT_SELECTOR = [
  'title',
  'h1, h2, h3, h4, h5, h6',
  'p', 'li', 'label', 'figcaption',
  '.sd-top__label', '.sd-top__statement', '.sd-top__cta',
  '.sd-section__label', '.sd-h1__tagline',
  '.sd-services__t', '.sd-links__t',
  '.nav__link', '.nav__cta', '.nav__wm',
  '.btn', 'button',
  'span[data-i18n]',
  'h5', // footer column headings
].join(',');

// Attributes worth translating (meta description gets handled too).
const ATTR_TARGETS = [
  { selector: 'input[placeholder], textarea[placeholder]', attr: 'placeholder' },
  { selector: '[aria-label]', attr: 'aria-label' },
  { selector: 'input[type=text][value]', attr: 'value' },
  { selector: 'meta[name=description]', attr: 'content' },
];

// Tags that may appear inside a translated paragraph alongside text nodes.
const INLINE_TAGS = new Set(['STRONG', 'EM', 'B', 'I', 'A', 'SPAN', 'SMALL', 'BR']);

const originalText = new WeakMap();
const originalAttr = new WeakMap();

function lookup(dict, original) {
  const key = original.replace(/\s+/g, ' ').trim();
  return key && dict?.[key] ? original.replace(key, dict[key]) : original;
}

function snapshotText(el) {
  if (!originalText.has(el)) originalText.set(el, el.textContent);
  return originalText.get(el);
}

function applySimple(el, dict) {
  const original = snapshotText(el);
  el.textContent = dict ? lookup(dict, original) : original;
}

function applyMixed(el, dict) {
  // Translate each direct text-node child individually, then recurse into
  // any inline tags. Preserves <strong>, <a>, <br> in place.
  el.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (!originalText.has(node)) originalText.set(node, node.textContent);
      const orig = originalText.get(node);
      node.textContent = dict ? lookup(dict, orig) : orig;
    } else if (node.nodeType === Node.ELEMENT_NODE && INLINE_TAGS.has(node.tagName)) {
      applyMixed(node, dict);
    }
  });
}

function applyElement(el, dict) {
  // Pick the cheap path when the element is text-only.
  const hasChildElements = el.firstElementChild !== null;
  if (!hasChildElements) applySimple(el, dict);
  else applyMixed(el, dict);
}

function applyAttr(el, attr, dict) {
  const store = originalAttr.get(el) || {};
  if (store[attr] === undefined) {
    store[attr] = el.getAttribute(attr);
    originalAttr.set(el, store);
  }
  const original = store[attr];
  if (original == null) return;
  el.setAttribute(attr, dict ? lookup(dict, original) : original);
}

function rewriteInternalLinks(lang) {
  // Mirror the active language onto every internal link so navigation
  // stays in the user's chosen locale.
  document.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href) return;
    if (/^(mailto:|tel:|https?:|#)/i.test(href)) return;
    if (!/\.html(\?|$|#)/i.test(href) && href !== '/' && !href.startsWith('./')) return;

    // Strip any prior lang param, then append the new one if needed.
    const clean = href
      .replace(/([?&])lang=(en|fr)(&|$)/, (_, pre, _l, post) => (post === '&' ? pre : ''))
      .replace(/\?$/, '');
    a.setAttribute('href', lang === 'fr' ? clean + (clean.includes('?') ? '&' : '?') + 'lang=fr' : clean);
  });

  // Keep the URL bar honest.
  if (window.history?.replaceState) {
    const url = new URL(window.location.href);
    if (lang === 'fr') url.searchParams.set('lang', 'fr');
    else url.searchParams.delete('lang');
    window.history.replaceState({}, '', url.toString());
  }
}

export function setLang(lang) {
  if (!SUPPORTED.includes(lang)) lang = 'en';
  const dict = lang === 'en' ? null : translations[lang];

  document.querySelectorAll(TEXT_SELECTOR).forEach((el) => applyElement(el, dict));
  ATTR_TARGETS.forEach(({ selector, attr }) => {
    document.querySelectorAll(selector).forEach((el) => applyAttr(el, attr, dict));
  });

  document.documentElement.lang = lang;
  try { localStorage.setItem(STORAGE_KEY, lang); } catch {}

  document.querySelectorAll('.nav__lang').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.lang === lang);
  });

  rewriteInternalLinks(lang);
}

function resolveInitialLang() {
  const fromUrl = new URLSearchParams(location.search).get('lang');
  if (SUPPORTED.includes(fromUrl)) return fromUrl;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (SUPPORTED.includes(stored)) return stored;
  } catch {}
  return 'en';
}

document.querySelectorAll('.nav__lang').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    setLang(btn.dataset.lang);
  });
});

setLang(resolveInitialLang());
