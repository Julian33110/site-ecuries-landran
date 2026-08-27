// ── SCROLL: header sticky + reveal ──
const header = document.getElementById('header');
const revealEls = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

revealEls.forEach(el => observer.observe(el));

window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// ── HERO image parallax & load ──
const heroImg = document.querySelector('.hero-img');
if (heroImg) {
  heroImg.addEventListener('load', () => heroImg.classList.add('loaded'));
  if (heroImg.complete) heroImg.classList.add('loaded');

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y < window.innerHeight) {
      heroImg.style.transform = `scale(1) translateY(${y * 0.25}px)`;
    }
  }, { passive: true });
}

// ── BURGER MENU MOBILE ──
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobile-menu');
const mobileMenuClose = document.getElementById('mobile-menu-close');

function closeMenu() {
  mobileMenu.classList.remove('open');
  document.body.style.overflow = '';
}

function openMenu() {
  mobileMenu.classList.add('open');
  document.body.style.overflow = 'hidden';
}

burger.addEventListener('click', () => {
  mobileMenu.classList.contains('open') ? closeMenu() : openMenu();
});

mobileMenuClose.addEventListener('click', closeMenu);

mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', closeMenu);
});

// ── SMOOTH ACTIVE NAV ──
const sections = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navAnchors.forEach(a => {
        a.style.background = a.getAttribute('href') === `#${id}` ? 'rgba(255,255,255,.12)' : '';
      });
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => sectionObserver.observe(s));

// ── STAGGER STAT ITEMS ──
document.querySelectorAll('.stat-item').forEach((el, i) => {
  el.style.setProperty('--i', i);
  el.style.transitionDelay = `${i * 0.1}s`;
});

// ── FORM SUBMIT ──
async function submitForm(formEl, endpoint, successMsg, defaultLabel, onReset) {
  const btn = formEl.querySelector('button[type="submit"]');
  btn.textContent = 'Envoi en cours…';
  btn.disabled = true;
  try {
    const data = Object.fromEntries(new FormData(formEl));
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json.success) {
      btn.textContent = successMsg;
      btn.style.background = '#2d5a2d';
      formEl.reset();
      if (onReset) onReset();
      setTimeout(() => { btn.textContent = defaultLabel; btn.style.background = ''; if (!onReset) btn.disabled = false; }, 5000);
    } else throw new Error();
  } catch {
    btn.textContent = 'Erreur — réessayez';
    btn.style.background = '#8b1a1a';
    setTimeout(() => { btn.textContent = defaultLabel; btn.style.background = ''; btn.disabled = false; }, 3000);
  }
}

const form = document.getElementById('form');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitForm(form, '/api/contact', '✓ Message envoyé !', 'Envoyer le message');
  });
}

// ── FORMULAIRE INSCRIPTION ──
const inscForm = document.getElementById('insc-form');
if (inscForm) {
  // Anti-spam : horodatage du chargement du formulaire
  const inscTsField = document.getElementById('insc_ts');
  if (inscTsField) inscTsField.value = Date.now();

  // Anti-spam : le bouton reste désactivé tant que Turnstile n'a pas validé
  window.onInscTurnstileSuccess = function () {
    const btn = inscForm.querySelector('button[type="submit"]');
    if (btn) btn.disabled = false;
  };

  const typeSelect = document.getElementById('type_inscription');
  const modaliteGroup = document.getElementById('modalite-group');

  typeSelect.addEventListener('change', () => {
    modaliteGroup.style.display = typeSelect.value === 'annee' ? 'flex' : 'none';
  });
  modaliteGroup.style.display = 'none';

  inscForm.addEventListener('submit', (e) => {
    e.preventDefault();
    submitForm(inscForm, '/api/inscription', '✓ Demande envoyée ! Nous vous contactons sous 48h.', 'Envoyer ma demande d\'inscription', () => {
      // Reformulaire : nouveau jeton Turnstile + horodatage nécessaires
      if (inscTsField) inscTsField.value = Date.now();
      if (window.turnstile) window.turnstile.reset();
    });
    modaliteGroup.style.display = 'none';
  });
}

// ── LIGHTBOX ──
(function () {
  const items = document.querySelectorAll('.gal-item');
  const lightbox = document.getElementById('lightbox');
  if (!lightbox || !items.length) return;

  const lbImg = document.getElementById('lb-img');
  const lbCaption = document.getElementById('lb-caption');
  const lbClose = document.getElementById('lb-close');
  const lbPrev = document.getElementById('lb-prev');
  const lbNext = document.getElementById('lb-next');

  const galData = Array.from(items).map(item => {
    const img = item.querySelector('img');
    return { src: img.src.replace(/w=\d+/, 'w=1600'), alt: img.alt };
  });

  let current = 0;

  function show(index) {
    current = (index + galData.length) % galData.length;
    lbImg.src = galData[current].src;
    lbImg.alt = galData[current].alt;
    lbCaption.textContent = galData[current].alt;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  items.forEach(item => item.addEventListener('click', () => show(parseInt(item.dataset.index))));
  lbClose.addEventListener('click', close);
  lbPrev.addEventListener('click', () => show(current - 1));
  lbNext.addEventListener('click', () => show(current + 1));
  lightbox.addEventListener('click', e => { if (e.target === lightbox) close(); });
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });
})();

// ── COUNTER ANIMATION ──
function animateCounter(el, target, duration = 1800) {
  let start = null;
  const step = (ts) => {
    if (!start) start = ts;
    const progress = Math.min((ts - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(ease * target);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  };
  requestAnimationFrame(step);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target.querySelector('.stat-number');
      const target = parseInt(el.textContent);
      if (!isNaN(target)) animateCounter(el, target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-item').forEach(el => counterObserver.observe(el));

// ── CRÉNEAU DYNAMIQUE ──
(function () {
  const SLOTS = {
    '':  [{ v: 'mer-1430', l: 'Mercredi 14h30 — Débutants (Élise)' },
          { v: 'sam-1200', l: 'Samedi 12h00 — Débutants (Élise)' }],
    '1': [{ v: 'mer-1500', l: 'Mercredi 15h00 — Galop 1/2 (Élise)' },
          { v: 'sam-1100', l: 'Samedi 11h00 — Galop 1/2 (Élise)' }],
    '2': [{ v: 'mer-1500', l: 'Mercredi 15h00 — Galop 1/2 (Élise)' },
          { v: 'mer-1530', l: 'Mercredi 15h30 — Groupe 2/3 (Clara)' },
          { v: 'mer-1630', l: 'Mercredi 16h30 — Galop 2/3 (Élise)' },
          { v: 'sam-1100', l: 'Samedi 11h00 — Galop 1/2 (Élise)' },
          { v: 'sam-1130', l: 'Samedi 11h30 — Groupe 2/3 (Clara)' },
          { v: 'sam-1430', l: 'Samedi 14h30 — Galop 2/3 (Élise)' }],
    '3': [{ v: 'mer-1530', l: 'Mercredi 15h30 — Groupe 2/3 (Clara)' },
          { v: 'mer-1630', l: 'Mercredi 16h30 — Galop 2/3 (Élise)' },
          { v: 'sam-1130', l: 'Samedi 11h30 — Groupe 2/3 (Clara)' },
          { v: 'sam-1430', l: 'Samedi 14h30 — Galop 2/3 (Élise)' }],
    '4': [{ v: 'mer-1730', l: 'Mercredi 17h30 — Galop 4/5 (Élise)' },
          { v: 'sam-1030', l: 'Samedi 10h30 — Groupe 4/5 (Clara)' },
          { v: 'sam-1530', l: 'Samedi 15h30 — Galop 4/5 (Élise)' }],
    '5': [{ v: 'mer-1730', l: 'Mercredi 17h30 — Galop 4/5 (Élise)' },
          { v: 'sam-1030', l: 'Samedi 10h30 — Groupe 4/5 (Clara)' },
          { v: 'sam-1530', l: 'Samedi 15h30 — Galop 4/5 (Élise)' }],
    '6': [{ v: 'mer-1830', l: 'Mercredi 18h30 — Groupe 6-7 (Clara)' },
          { v: 'jeu-1830', l: 'Jeudi 18h30 — Groupe 6-7 (Clara)' },
          { v: 'ven-1830', l: 'Vendredi 18h30 — Groupe 6-7 (Clara)' },
          { v: 'sam-0930', l: 'Samedi 9h30 — Galop 6/7 (Clara)' }],
    '7': [{ v: 'mer-1830', l: 'Mercredi 18h30 — Groupe 6-7 (Clara)' },
          { v: 'jeu-1830', l: 'Jeudi 18h30 — Groupe 6-7 (Clara)' },
          { v: 'ven-1830', l: 'Vendredi 18h30 — Groupe 6-7 (Clara)' },
          { v: 'sam-0930', l: 'Samedi 9h30 — Galop 6/7 (Clara)' }],
  };

  const galopSel   = document.getElementById('dernier_galop');
  const creneauSel = document.getElementById('creneau');
  if (!galopSel || !creneauSel) return;

  function update() {
    const slots = SLOTS[galopSel.value] || SLOTS[''];
    creneauSel.innerHTML = '<option value="">Choisir un créneau…</option>' +
      slots.map(s => `<option value="${s.v}">${s.l}</option>`).join('');
  }

  galopSel.addEventListener('change', update);
  update();
})();
