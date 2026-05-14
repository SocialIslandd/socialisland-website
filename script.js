// Load photo dynamically
const wrap = document.getElementById('photo-wrap');
if (wrap) {
  const img = new Image();
  img.src = 'foto.jpg';
  img.alt = 'Billy & Céline — Social Island';
  img.onload = () => { wrap.innerHTML = ''; wrap.appendChild(img); };
}

// ── Three.js Hologram Robot ────────────────────────────────────
window.addEventListener('load', () => {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 200);

  const TEAL  = 0x4BACBA;
  const GOLD  = 0xC4924A;
  const WHITE = 0xddeeff;

  // Helper: glowing edge mesh
  function lines(geo, color, opacity = 1.0) {
    return new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity })
    );
  }

  // ── Stars ──
  const sp = new Float32Array(900 * 3);
  for (let i = 0; i < sp.length; i++) sp[i] = (Math.random() - 0.5) * 120;
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  scene.add(new THREE.Points(starGeo,
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, transparent: true, opacity: 0.4 })
  ));

  // ── Build hologram robot ──
  const robot = new THREE.Group();

  // — TORSO —
  const torso = new THREE.Group();

  // Main torso box
  torso.add(lines(new THREE.BoxGeometry(1.1, 1.3, 0.55), TEAL));
  // Inner chest panel
  const panel = lines(new THREE.BoxGeometry(0.55, 0.65, 0.57), GOLD, 0.45);
  panel.position.y = 0.1;
  torso.add(panel);
  // Chest core dot
  const coreDot = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 8, 8),
    new THREE.MeshBasicMaterial({ color: GOLD })
  );
  coreDot.position.set(0, 0.15, 0.29);
  torso.add(coreDot);

  // Shoulder pads
  [-0.68, 0.68].forEach(x => {
    const pad = lines(new THREE.BoxGeometry(0.3, 0.32, 0.32), TEAL, 0.8);
    pad.position.set(x, 0.52, 0);
    torso.add(pad);
  });

  // Waist
  const waist = lines(new THREE.BoxGeometry(0.8, 0.22, 0.48), GOLD, 0.55);
  waist.position.y = -0.76;
  torso.add(waist);

  torso.position.y = 0.4;
  robot.add(torso);

  // — ARMS —
  [-0.82, 0.82].forEach(x => {
    const arm = new THREE.Group();

    // Upper arm
    const upper = lines(new THREE.BoxGeometry(0.24, 0.6, 0.24), TEAL, 0.75);
    upper.position.y = -0.3;
    arm.add(upper);

    // Elbow joint
    const elbow = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 8, 8),
      new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0.7 })
    );
    elbow.position.y = -0.65;
    arm.add(elbow);

    // Lower arm
    const lower = lines(new THREE.BoxGeometry(0.2, 0.52, 0.2), TEAL, 0.6);
    lower.position.y = -1.0;
    arm.add(lower);

    // Hand
    const hand = lines(new THREE.BoxGeometry(0.24, 0.24, 0.2), GOLD, 0.65);
    hand.position.y = -1.35;
    arm.add(hand);

    arm.position.set(x, 0.87, 0);
    arm.rotation.z = x > 0 ? -0.12 : 0.12;
    robot.add(arm);
  });

  // — LEGS —
  [-0.32, 0.32].forEach(x => {
    const leg = new THREE.Group();

    // Upper leg
    const upper = lines(new THREE.BoxGeometry(0.3, 0.72, 0.32), TEAL, 0.7);
    upper.position.y = -0.36;
    leg.add(upper);

    // Knee
    const knee = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 8, 8),
      new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0.6 })
    );
    knee.position.y = -0.76;
    leg.add(knee);

    // Lower leg
    const lower = lines(new THREE.BoxGeometry(0.26, 0.62, 0.3), TEAL, 0.6);
    lower.position.y = -1.12;
    leg.add(lower);

    // Foot
    const foot = lines(new THREE.BoxGeometry(0.32, 0.18, 0.5), GOLD, 0.55);
    foot.position.set(0, -1.52, 0.1);
    leg.add(foot);

    leg.position.set(x, -0.28, 0);
    robot.add(leg);
  });

  // — HEAD GROUP (rotates with cursor) —
  const headGroup = new THREE.Group();

  // Neck
  const neck = lines(new THREE.CylinderGeometry(0.12, 0.16, 0.28, 8), TEAL, 0.6);
  headGroup.add(neck);

  // Head box
  headGroup.add(lines(new THREE.BoxGeometry(0.72, 0.76, 0.64), TEAL));
  headGroup.add(lines(new THREE.BoxGeometry(0.72, 0.76, 0.64), WHITE, 0.12)); // subtle white inner

  // Visor — bright gold bar
  const visorGeo = new THREE.BoxGeometry(0.62, 0.2, 0.66);
  headGroup.add(lines(visorGeo, GOLD, 1.0));
  // Visor fill plane (teal glow)
  const visorFill = new THREE.Mesh(
    new THREE.PlaneGeometry(0.56, 0.14),
    new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0.25, side: THREE.DoubleSide })
  );
  visorFill.position.set(0, 0.09, 0.33);
  headGroup.add(visorFill);

  // Top ridge
  const ridge = lines(new THREE.BoxGeometry(0.5, 0.08, 0.5), GOLD, 0.5);
  ridge.position.y = 0.42;
  headGroup.add(ridge);

  // Antenna nubs
  [-0.14, 0.14].forEach(x => {
    const nub = lines(new THREE.BoxGeometry(0.06, 0.16, 0.06), GOLD, 0.8);
    nub.position.set(x, 0.52, 0);
    headGroup.add(nub);
  });

  headGroup.position.set(0, 1.55, 0); // sit on top of torso
  robot.add(headGroup);

  // Position robot centered, slightly lower
  robot.position.set(0, -0.5, 0);
  scene.add(robot);

  // ── Ground glow ring ──
  const ringMat = new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
  const ringMesh = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.0, 64), ringMat);
  ringMesh.rotation.x = -Math.PI / 2;
  ringMesh.position.y = -2.25;
  scene.add(ringMesh);

  const discMat = new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0.05, side: THREE.DoubleSide });
  const discMesh = new THREE.Mesh(new THREE.CircleGeometry(0.9, 64), discMat);
  discMesh.rotation.x = -Math.PI / 2;
  discMesh.position.y = -2.25;
  scene.add(discMesh);

  // ── Orbiting particles ──
  const partCount = 50;
  const partPositions = new Float32Array(partCount * 3);
  const partData = Array.from({ length: partCount }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const r     = 1.4 + Math.random() * 1.2;
    const y     = (Math.random() - 0.5) * 4;
    return { angle, r, speed: (Math.random() - 0.5) * 0.01 + 0.003, y, oy: y };
  });
  const partBuf = new THREE.BufferGeometry();
  partBuf.setAttribute('position', new THREE.BufferAttribute(partPositions, 3));
  scene.add(new THREE.Points(partBuf,
    new THREE.PointsMaterial({ color: GOLD, size: 0.055, transparent: true, opacity: 0.75 })
  ));

  // ── Mouse / cursor tracking ──
  let mouseX = 0, mouseY = 0;
  let curRotY = 0, curRotX = 0;

  window.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });
  window.addEventListener('touchmove', e => {
    if (!e.touches[0]) return;
    mouseX = (e.touches[0].clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.touches[0].clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  // ── Resize ──
  function resize() {
    const w = canvas.offsetWidth  || window.innerWidth;
    const h = canvas.offsetHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const dist = camera.aspect < 0.8 ? 9 : 6.5;
    camera.position.set(0, 0.6, dist);
    camera.lookAt(0, 0.2, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  // ── Animate ──
  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.016;

    // Head follows cursor
    curRotY += (mouseX * 0.65  - curRotY) * 0.05;
    curRotX += (-mouseY * 0.32 - curRotX) * 0.05;
    headGroup.rotation.y = curRotY;
    headGroup.rotation.x = curRotX;

    // Idle body sway
    robot.rotation.y    = Math.sin(t * 0.3) * 0.04;
    torso.position.y    = 0.4 + Math.sin(t * 1.1) * 0.025; // breathe

    // Visor / core pulse
    coreDot.material.opacity = 0.6 + Math.sin(t * 2.5) * 0.4;
    visorFill.material.opacity = 0.18 + Math.sin(t * 2) * 0.1;

    // Ring pulse
    ringMat.opacity  = 0.25 + Math.sin(t * 1.8) * 0.15;
    discMat.opacity  = 0.04 + Math.sin(t * 1.4) * 0.03;

    // Orbit particles
    const pp = partBuf.attributes.position.array;
    partData.forEach((p, i) => {
      p.angle += p.speed;
      pp[i * 3]     = Math.cos(p.angle) * p.r;
      pp[i * 3 + 1] = p.oy + Math.sin(t * 0.6 + i) * 0.12;
      pp[i * 3 + 2] = Math.sin(p.angle) * p.r;
    });
    partBuf.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  }
  animate();
});

// ── Navbar ──────────────────────────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// Hero fade on scroll
const heroContent = document.querySelector('.hero-content');
window.addEventListener('scroll', () => {
  if (!heroContent) return;
  const y = window.scrollY;
  heroContent.style.opacity   = Math.max(0, 1 - y / 480);
  heroContent.style.transform = `translateY(${y * 0.09}px)`;
}, { passive: true });

// Mobile menu
const toggle     = document.querySelector('.nav-toggle');
const mobileMenu = document.querySelector('.nav-mobile');
toggle?.addEventListener('click', () => mobileMenu.classList.toggle('open'));
document.querySelectorAll('.nav-mobile a').forEach(l =>
  l.addEventListener('click', () => mobileMenu.classList.remove('open'))
);

// Reveal on scroll
const observer = new IntersectionObserver(
  entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
  { threshold: 0.10, rootMargin: '0px 0px -40px 0px' }
);
document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 80}ms`;
  observer.observe(el);
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});
