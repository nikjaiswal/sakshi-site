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

// Hero: the witness eye looks at each investigative domain in turn, follows
// the pointer while it is over the hero, dilates slightly when looked at,
// and blinks at irregular intervals. Without JavaScript it is a still image.
function initWitness() {
  const root = document.querySelector('.hero__witness');
  const iris = document.getElementById('w-iris');
  const pupil = document.getElementById('w-pupil');
  const lids = document.getElementById('w-lids');
  const beam = document.getElementById('w-beam');
  const now = document.getElementById('w-now');
  const nodes = [...document.querySelectorAll('#w-nodes .w-node')];
  if (!root || !iris || !pupil || !lids || !beam || !now || !nodes.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const center = { x: 300, y: 250 };
  const reach = 58;
  const positions = nodes.map((n) => {
    const m = /translate\(([-\d.]+)\s+([-\d.]+)\)/.exec(n.getAttribute('transform'));
    return { x: Number(m[1]), y: Number(m[2]) };
  });

  let gaze = { x: 0, y: 0 };
  const lookAt = (x, y, limit = reach) => {
    const dx = x - center.x, dy = y - center.y;
    const d = Math.hypot(dx, dy) || 1;
    const k = Math.min(1, limit / d);
    gaze = { x: dx * k, y: dy * k * 0.75 };
    iris.style.transform = `translate(${gaze.x.toFixed(1)}px, ${gaze.y.toFixed(1)}px)`;
  };

  if (reduceMotion) {
    now.textContent = 'Four domains';
    beam.style.display = 'none';
    nodes.forEach((n) => n.classList.add('is-active'));
    return;
  }

  let active = 0;
  let pointerUntil = 0;
  let cycleTimer = null;

  const focusNode = (i) => {
    nodes.forEach((n, j) => {
      n.classList.toggle('is-active', j === i);
      n.classList.toggle('is-done', j < i);
    });
    const p = positions[i];
    beam.style.opacity = '0';
    setTimeout(() => {
      beam.setAttribute('x2', p.x);
      beam.setAttribute('y2', p.y);
      beam.style.opacity = '';
    }, 180);
    now.classList.add('is-swapping');
    setTimeout(() => {
      now.textContent = nodes[i].getAttribute('data-label');
      now.classList.remove('is-swapping');
    }, 220);
    if (Date.now() > pointerUntil) lookAt(p.x, p.y, reach * 0.85);
  };

  const scheduleCycle = () => {
    clearInterval(cycleTimer);
    cycleTimer = setInterval(() => {
      active = (active + 1) % nodes.length;
      focusNode(active);
    }, 2800);
  };
  focusNode(0);
  scheduleCycle();

  // Small idle drift so the gaze never looks frozen.
  setInterval(() => {
    if (Date.now() > pointerUntil) {
      const jx = (Math.random() - 0.5) * 6, jy = (Math.random() - 0.5) * 4;
      iris.style.transform = `translate(${(gaze.x + jx).toFixed(1)}px, ${(gaze.y + jy).toFixed(1)}px)`;
    }
  }, 1400);

  // Follow the pointer while it is over the hero; the pupil widens when the
  // viewer is close to the eye.
  const svg = root.querySelector('svg');
  const hero = root.closest('.section--hero') || root;
  hero.addEventListener('pointermove', (event) => {
    const r = svg.getBoundingClientRect();
    const x = ((event.clientX - r.left) / r.width) * 600;
    const y = ((event.clientY - r.top) / r.height) * 530;
    pointerUntil = Date.now() + 1800;
    lookAt(x, y);
    pupil.classList.toggle('is-wide', Math.hypot(x - center.x, y - center.y) < 150);
  });
  hero.addEventListener('pointerleave', () => {
    pointerUntil = 0;
    pupil.classList.remove('is-wide');
    const p = positions[active];
    lookAt(p.x, p.y, reach * 0.85);
  });

  // Blink at irregular intervals, occasionally twice.
  const blinkOnce = () => {
    lids.classList.remove('is-blinking');
    void lids.getBBox();
    lids.classList.add('is-blinking');
    setTimeout(() => lids.classList.remove('is-blinking'), 260);
  };
  const blink = () => {
    blinkOnce();
    if (Math.random() < 0.25) setTimeout(blinkOnce, 340);
    setTimeout(blink, 3200 + Math.random() * 4500);
  };
  setTimeout(blink, 2200);
}

document.addEventListener('DOMContentLoaded', initWitness);
