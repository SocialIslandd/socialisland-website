// Load photo dynamically — if foto.jpg exists, show it
const wrap = document.getElementById('photo-wrap');
if (wrap) {
  const img = new Image();
  img.src = 'foto.jpg';
  img.alt = 'Billy & Céline — Social Island';
  img.onload = () => {
    wrap.innerHTML = '';
    wrap.appendChild(img);
  };
}

// Navbar scroll effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// Hero content fade on scroll
const heroContent = document.querySelector('.hero-content');
window.addEventListener('scroll', () => {
  if (!heroContent) return;
  const y = window.scrollY;
  heroContent.style.opacity = Math.max(0, 1 - y / 460);
  heroContent.style.transform = `translateY(${y * 0.10}px)`;
}, { passive: true });

// Mobile menu toggle
const toggle = document.querySelector('.nav-toggle');
const mobileMenu = document.querySelector('.nav-mobile');
toggle?.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
});
document.querySelectorAll('.nav-mobile a').forEach(link => {
  link.addEventListener('click', () => mobileMenu.classList.remove('open'));
});

// Reveal on scroll
const observer = new IntersectionObserver(
  (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
  { threshold: 0.10, rootMargin: '0px 0px -40px 0px' }
);
document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 80}ms`;
  observer.observe(el);
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
