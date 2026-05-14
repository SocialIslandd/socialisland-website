import { animate, scroll, inView } from 'https://cdn.jsdelivr.net/npm/motion@11/+esm';

// ══════════════════════════════════════════════
//  PHOTO — load dynamically
// ══════════════════════════════════════════════
const photoWrap = document.getElementById('photo-wrap');
if (photoWrap) {
  const img = new Image();
  img.src = 'foto.jpg';
  img.alt = 'Billy & Céline — Social Island';
  img.onload = () => { photoWrap.innerHTML = ''; photoWrap.appendChild(img); };
}

// ══════════════════════════════════════════════
//  SCROLL-DRIVEN 3D INTRO
// ══════════════════════════════════════════════
(function initScrollIntro() {
  const canvas   = document.getElementById('intro-canvas');
  const introEl  = document.getElementById('scroll-intro');
  if (!canvas || !introEl || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x020208, 1);

  const scene  = new THREE.Scene();
  scene.fog    = new THREE.FogExp2(0x020208, 0.055);

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 150);
  camera.position.set(0, 0, 14);

  const TEAL = 0x4BACBA;
  const GOLD = 0xC4924A;

  // ── Stars ──
  const starPos = new Float32Array(2000 * 3);
  for (let i = 0; i < starPos.length; i++) starPos[i] = (Math.random() - 0.5) * 100;
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  scene.add(new THREE.Points(starGeo,
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.09, transparent: true, opacity: 0.6 })
  ));

  // ── Ring tunnel ──
  const rings  = [];
  const RING_COUNT = 10;
  for (let i = 0; i < RING_COUNT; i++) {
    const isTeal  = i % 2 === 0;
    const radius  = 2.2 + (i % 3) * 0.4;
    const geo     = new THREE.TorusGeometry(radius, 0.025, 16, 120);
    const mat     = new THREE.MeshBasicMaterial({
      color: isTeal ? TEAL : GOLD,
      transparent: true,
      opacity: 0.7,
    });
    const ring    = new THREE.Mesh(geo, mat);
    ring.position.z = -i * 8;
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);
    rings.push({ mesh: ring, mat, baseZ: ring.position.z, isTeal });
  }

  // ── Floating particles ──
  const partCount = 300;
  const partPos   = new Float32Array(partCount * 3);
  for (let i = 0; i < partCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r     = Math.random() * 3;
    partPos[i * 3]     = Math.cos(angle) * r;
    partPos[i * 3 + 1] = Math.sin(angle) * r;
    partPos[i * 3 + 2] = -(Math.random() * RING_COUNT * 8);
  }
  const partGeo = new THREE.BufferGeometry();
  partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3));
  scene.add(new THREE.Points(partGeo,
    new THREE.PointsMaterial({ color: TEAL, size: 0.05, transparent: true, opacity: 0.5 })
  ));

  // ── Central glowing core ──
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 32, 32),
    new THREE.MeshBasicMaterial({ color: TEAL })
  );
  core.position.z = -RING_COUNT * 8 + 4;
  scene.add(core);

  const coreRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.2, 0.04, 16, 80),
    new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.8 })
  );
  coreRing.position.z = core.position.z;
  coreRing.rotation.x = Math.PI / 2;
  scene.add(coreRing);

  // ── Resize ──
  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  const CAM_START = 14;
  const CAM_END   = core.position.z + 3;
  let   camTargetZ = CAM_START;

  scroll(({ y }) => {
    camTargetZ = CAM_START + (CAM_END - CAM_START) * y.progress;
  }, { target: introEl });

  let t = 0;
  function loop() {
    requestAnimationFrame(loop);
    t += 0.016;

    camera.position.z += (camTargetZ - camera.position.z) * 0.08;
    camera.position.x = Math.sin(t * 0.2) * 0.15;
    camera.position.y = Math.cos(t * 0.15) * 0.10;
    camera.lookAt(0, 0, camera.position.z - 5);

    rings.forEach(({ mesh, mat }) => {
      mesh.rotation.z += 0.002;
      const dist = Math.abs(camera.position.z - mesh.position.z);
      mat.opacity = Math.max(0.15, 0.9 - dist * 0.04);
    });

    const pulse = 0.85 + Math.sin(t * 2.5) * 0.15;
    core.scale.setScalar(pulse);
    coreRing.rotation.z += 0.01;

    renderer.render(scene, camera);
  }
  loop();
})();

// ══════════════════════════════════════════════
//  HERO — Neural Network Canvas
// ══════════════════════════════════════════════
window.addEventListener('load', () => {
  const canvas = document.getElementById('neural-canvas');
  if (!canvas) return;
  const ctx  = canvas.getContext('2d');
  const GOLD = [196, 146, 74];
  const TEAL = [75, 172, 186];
  let particles = [];

  function resize() {
    canvas.width  = canvas.offsetWidth  || window.innerWidth;
    canvas.height = canvas.offsetHeight || window.innerHeight;
  }
  function initParticles() {
    const count = Math.min(Math.floor((canvas.width * canvas.height) / 13000), 80);
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      r:  Math.random() * 1.8 + 0.8,
      color: Math.random() > 0.5 ? GOLD : TEAL,
    }));
  }
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const maxDist = 160;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d  = Math.hypot(dx, dy);
        if (d < maxDist) {
          const a = (1 - d / maxDist) * 0.28;
          const c = particles[i].color;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${a})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
    }
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},0.75)`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  resize(); initParticles(); draw();
  window.addEventListener('resize', () => { resize(); initParticles(); });
});

// ══════════════════════════════════════════════
//  HERO CARD — Spotlight Effect
// ══════════════════════════════════════════════
const heroCard      = document.getElementById('hero-card');
const heroSpotlight = document.getElementById('hero-spotlight');

if (heroCard && heroSpotlight) {
  heroCard.addEventListener('mousemove', (e) => {
    const rect = heroCard.getBoundingClientRect();
    heroSpotlight.style.left    = (e.clientX - rect.left) + 'px';
    heroSpotlight.style.top     = (e.clientY - rect.top)  + 'px';
    heroSpotlight.style.opacity = '1';
  });
  heroCard.addEventListener('mouseleave', () => {
    heroSpotlight.style.opacity = '0';
  });
}

// ══════════════════════════════════════════════
//  NAVBAR
// ══════════════════════════════════════════════
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// ══════════════════════════════════════════════
//  HERO CONTENT — fade in / fade on scroll
// ══════════════════════════════════════════════
const heroSection = document.getElementById('hero');
const heroContent = document.querySelector('.hero-card-left');

if (heroContent) {
  heroContent.style.opacity = '0';
  inView(heroSection, () => {
    animate(heroContent,
      { opacity: [0, 1], y: [30, 0] },
      { duration: 0.9, easing: [0.16, 1, 0.3, 1] }
    );
  });

  scroll(({ y }) => {
    const introH = document.getElementById('scroll-intro')?.offsetHeight || 0;
    const relY   = Math.max(0, window.scrollY - introH);
    heroContent.style.opacity   = String(Math.max(0, 1 - relY / 600));
    heroContent.style.transform = `translateY(${relY * 0.06}px)`;
  });
}

// ══════════════════════════════════════════════
//  MOBILE MENU
// ══════════════════════════════════════════════
const toggle     = document.querySelector('.nav-toggle');
const mobileMenu = document.querySelector('.nav-mobile');
toggle?.addEventListener('click', () => mobileMenu.classList.toggle('open'));
document.querySelectorAll('.nav-mobile a').forEach(l =>
  l.addEventListener('click', () => mobileMenu.classList.remove('open'))
);

// ══════════════════════════════════════════════
//  REVEAL ANIMATIONS — inView
// ══════════════════════════════════════════════
document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.opacity  = '0';
  el.style.transform = 'translateY(30px)';

  inView(el, () => {
    animate(el,
      { opacity: [0, 1], y: [30, 0] },
      { duration: 0.7, delay: (i % 4) * 0.07, easing: [0.25, 0.1, 0.25, 1] }
    );
  }, { margin: '0px 0px -40px 0px' });
});

// ══════════════════════════════════════════════
//  COUNTER ANIMATIONS — metrics strip
// ══════════════════════════════════════════════
function animateCounter(el) {
  const target   = parseInt(el.dataset.count, 10);
  const duration = 1800;
  const startTime = performance.now();

  function update(now) {
    const elapsed  = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target);
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = target;
  }
  requestAnimationFrame(update);
}

document.querySelectorAll('[data-count]').forEach(el => {
  let triggered = false;
  inView(el, () => {
    if (!triggered) { triggered = true; animateCounter(el); }
  }, { margin: '0px 0px -20px 0px' });
});

// ══════════════════════════════════════════════
//  SMOOTH SCROLL — anchor links
// ══════════════════════════════════════════════
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});
