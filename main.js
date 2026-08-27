// ── ACCUEIL → retour tout en haut ──
document.querySelectorAll('a[href="#accueil"]').forEach(a => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    history.replaceState(null, '', ' ');
  });
});

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
    const formData = new FormData(formEl);
    const data = Object.fromEntries(formData);
    const creneaux = formData.getAll('creneau');
    if (creneaux.length) data.creneau = creneaux;
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

  const typeSelect = document.getElementById('type_inscription');
  const modaliteGroup = document.getElementById('modalite-group');
  const clubInfoRow = document.getElementById('club-info-row');
  const galopGroup = document.getElementById('galop-group');
  const coursSouhaiteSection = document.getElementById('cours-souhaite-section');

  function updateFormForType() {
    const isOccasionnel = typeSelect.value === 'occasionnel';
    modaliteGroup.style.display = typeSelect.value === 'annee' ? 'flex' : 'none';
    clubInfoRow.style.display = isOccasionnel ? 'none' : 'flex';
    galopGroup.style.display = isOccasionnel ? 'none' : 'block';
    coursSouhaiteSection.style.display = isOccasionnel ? 'none' : 'block';
  }

  typeSelect.addEventListener('change', updateFormForType);
  updateFormForType();

  inscForm.addEventListener('submit', (e) => {
    e.preventDefault();
    submitForm(inscForm, '/api/inscription', '✓ Demande envoyée ! Nous vous contactons sous 48h.', 'Envoyer ma demande d\'inscription', () => {
      // Reformulaire : nouveau jeton Turnstile + horodatage nécessaires
      if (inscTsField) inscTsField.value = Date.now();
      if (window.turnstile) window.turnstile.reset();
    });
    updateFormForType();
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

// ── BANNIÈRE BOUTIQUE PHOTOS ──
(function () {
  const banner = document.getElementById('photo-banner');
  if (!banner) return;

  function closeBanner() {
    banner.classList.remove('active');
    sessionStorage.setItem('photo-banner-seen', '1');
  }

  if (!sessionStorage.getItem('photo-banner-seen')) {
    setTimeout(() => banner.classList.add('active'), 1200);
  }

  document.getElementById('photo-banner-close').addEventListener('click', closeBanner);
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
    '':  [{ v: 'mer-1430', l: 'Mercredi 14h30 — Débutants (Équipe poney)' },
          { v: 'sam-1430', l: 'Samedi 14h30 — Débutants (Équipe poney)' }],
    '1': [{ v: 'mer-1500', l: 'Mercredi 15h00 — Galop 1/2 (Équipe poney)' },
          { v: 'sam-1100', l: 'Samedi 11h00 — Galop 1/2 (Équipe poney)' }],
    '2': [{ v: 'mer-1500', l: 'Mercredi 15h00 — Galop 1/2 (Équipe poney)' },
          { v: 'mer-1530', l: 'Mercredi 15h30 — Galop 2/3 (Clara)' },
          { v: 'mer-1630', l: 'Mercredi 16h30 — Galop 2/3 (Équipe poney)' },
          { v: 'sam-1100', l: 'Samedi 11h00 — Galop 1/2 (Équipe poney)' },
          { v: 'sam-1100c', l: 'Samedi 11h00 — Galop 2/3 (Clara)' },
          { v: 'sam-1330', l: 'Samedi 13h30 — Galop 2/3 (Équipe poney)' }],
    '3': [{ v: 'mer-1530', l: 'Mercredi 15h30 — Galop 2/3 (Clara)' },
          { v: 'mer-1630', l: 'Mercredi 16h30 — Galop 2/3 (Équipe poney)' },
          { v: 'sam-1100c', l: 'Samedi 11h00 — Galop 2/3 (Clara)' },
          { v: 'sam-1330', l: 'Samedi 13h30 — Galop 2/3 (Équipe poney)' }],
    '4': [{ v: 'mer-1730', l: 'Mercredi 17h30 — Galop 4/5 (Équipe poney)' },
          { v: 'mer-1730c', l: 'Mercredi 17h30 — Galop 4/5 (Clara)' },
          { v: 'sam-1000', l: 'Samedi 10h00 — Galop 4/5 (Clara)' },
          { v: 'sam-1530', l: 'Samedi 15h30 — Galop 4/5 (Équipe poney)' }],
    '5': [{ v: 'mer-1730', l: 'Mercredi 17h30 — Galop 4/5 (Équipe poney)' },
          { v: 'mer-1730c', l: 'Mercredi 17h30 — Galop 4/5 (Clara)' },
          { v: 'sam-1000', l: 'Samedi 10h00 — Galop 4/5 (Clara)' },
          { v: 'sam-1530', l: 'Samedi 15h30 — Galop 4/5 (Équipe poney)' }],
    '6': [{ v: 'mer-1830', l: 'Mercredi 18h30 — Galop 6-7 (Clara)' },
          { v: 'ven-1830', l: 'Vendredi 18h30 — Galop 6-7 (Clara)' },
          { v: 'sam-0900', l: 'Samedi 9h00 — Galop 6/7 (Clara)' }],
    '7': [{ v: 'mer-1830', l: 'Mercredi 18h30 — Galop 6-7 (Clara)' },
          { v: 'ven-1830', l: 'Vendredi 18h30 — Galop 6-7 (Clara)' },
          { v: 'sam-0900', l: 'Samedi 9h00 — Galop 6/7 (Clara)' }],
  };

  const galopSel     = document.getElementById('dernier_galop');
  const creneauGroup = document.getElementById('creneau-group');
  if (!galopSel || !creneauGroup) return;

  function update() {
    const slots = SLOTS[galopSel.value] || SLOTS[''];
    creneauGroup.innerHTML = slots.map(s => `
      <label style="display:flex;align-items:center;gap:10px;font-size:14px;color:#431F38;cursor:pointer;">
        <input type="checkbox" name="creneau" value="${s.v}" style="width:16px;height:16px;accent-color:#B48A2B;">
        ${s.l}
      </label>`).join('');
  }

  galopSel.addEventListener('change', update);
  update();
})();
