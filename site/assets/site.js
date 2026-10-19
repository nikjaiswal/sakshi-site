// SAKSHI site script. Mobile menu and scroll reveal adapted from the DOJO site
// by MIT Critical Data (MIT License; see vendor/LICENSE-dojo.txt). The site works without it.
document.documentElement.classList.add('js-enabled');

function initMobileMenu() {
  const toggle = document.querySelector('[data-mobile-menu-toggle]');
  const menu = document.querySelector('[data-mobile-menu]');

  if (!toggle || !menu) {
    return;
  }

  const setMenuState = (isOpen, { restoreFocus = false } = {}) => {
    menu.classList.toggle('is-open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));

    if (!isOpen && restoreFocus) {
      toggle.focus();
    }
  };

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    setMenuState(!isOpen);
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      setMenuState(false);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setMenuState(false, { restoreFocus: true });
    }
  });
}

function initScrollReveal() {
  const revealItems = [...document.querySelectorAll('[data-reveal]')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const showAll = () => {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  };

  if (!revealItems.length || reduceMotion || !('IntersectionObserver' in window)) {
    showAll();
    return;
  }

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        currentObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealItems.forEach((item) => observer.observe(item));
}

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initScrollReveal();
});

function initCopyButtons() {
  document.querySelectorAll('button.copy[data-copy]').forEach((btn) => {
    const original = btn.textContent;
    btn.addEventListener('click', () => {
      const text = btn.getAttribute('data-copy');
      const done = (ok) => {
        btn.textContent = ok ? 'Copied' : 'Select and copy: ' + text;
        setTimeout(() => { btn.textContent = original; }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => done(true), () => done(false));
      } else {
        done(false);
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', initCopyButtons);
