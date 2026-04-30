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

// ── BURGER MENU ──
const burger = document.getElementById('burger');
const navLinks = document.getElementById('nav-links');

burger.addEventListener('click', () => {
  burger.classList.toggle('open');
  navLinks.classList.toggle('open');
  document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    burger.classList.remove('open');
    navLinks.classList.remove('open');
    document.body.style.overflow = '';
  });
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

// ── FORM SUBMIT (demo) ──
const form = document.getElementById('form');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.textContent = '✓ Message envoyé !';
    btn.style.background = '#2d5a2d';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = 'Envoyer le message';
      btn.style.background = '';
      btn.disabled = false;
      form.reset();
    }, 3500);
  });
}

// ── FORMULAIRE INSCRIPTION ──
const inscForm = document.getElementById('insc-form');
if (inscForm) {
  const typeSelect = document.getElementById('type_inscription');
  const modaliteGroup = document.getElementById('modalite-group');

  typeSelect.addEventListener('change', () => {
    modaliteGroup.style.display = typeSelect.value === 'annee' ? 'flex' : 'none';
  });
  modaliteGroup.style.display = 'none';

  inscForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = inscForm.querySelector('button[type="submit"]');
    const orig = btn.textContent;
    btn.textContent = '✓ Demande envoyée ! Nous vous contactons sous 48h.';
    btn.style.background = '#2d5a2d';
    btn.disabled = true;
    inscForm.querySelectorAll('input,select,textarea').forEach(el => el.disabled = true);
    setTimeout(() => {
      btn.textContent = orig;
      btn.style.background = '';
      btn.disabled = false;
      inscForm.querySelectorAll('input,select,textarea').forEach(el => el.disabled = false);
      inscForm.reset();
      modaliteGroup.style.display = 'none';
    }, 5000);
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
