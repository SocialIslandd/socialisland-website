// Load photo dynamically
const wrap = document.getElementById('photo-wrap');
if (wrap) {
  const img = new Image();
  img.src = 'foto.jpg';
  img.alt = 'Billy & Céline — Social Island';
  img.onload = () => { wrap.innerHTML = ''; wrap.appendChild(img); };
}

// ── Three.js floating cubes ────────────────────────────────────
window.addEventListener('load', () => {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
  camera.position.set(0, 6, 22);
  camera.lookAt(0, 0, 0);

  // ── Stars ──
  const starGeo  = new THREE.BufferGeometry();
  const starCount = 600;
  const starPos   = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount * 3; i++) starPos[i] = (Math.random() - 0.5) * 120;
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, transparent: true, opacity: 0.5 });
  scene.add(new THREE.Points(starGeo, starMat));

  // ── Cubes ──
  const GOLD = 0xC4924A;
  const TEAL = 0x4BACBA;
  const PINK = 0xaa66cc;

  const cubes = [];

  // Grid cluster — 4×4 of cubes (like the Spline scene)
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const size = 1.4 + Math.random() * 0.3;
      const geo  = new THREE.BoxGeometry(size, size, size);

      // Solid face (very low opacity)
      const faceMat  = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.5 ? GOLD : TEAL,
        transparent: true,
        opacity: 0.04,
        side: THREE.FrontSide,
      });
      const faceMesh = new THREE.Mesh(geo, faceMat);

      // Glowing edges
      const edgeColor = [GOLD, TEAL, PINK][Math.floor(Math.random() * 3)];
      const edgeMat   = new THREE.LineBasicMaterial({
        color: edgeColor,
        transparent: true,
        opacity: 0.55 + Math.random() * 0.4,
      });
      const edgeMesh = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat);

      const group = new THREE.Group();
      group.add(faceMesh);
      group.add(edgeMesh);

      // Isometric-ish grid positions
      group.position.set(
        (col - 1.5) * 2.6,
        Math.random() * 0.6 - 0.3,
        (row - 1.5) * 2.6 - 2
      );
      group.rotation.set(0.3, 0.5, 0.1);

      group.userData = {
        rx:          (Math.random() - 0.5) * 0.006,
        ry:          (Math.random() - 0.5) * 0.009,
        floatAmp:    0.15 + Math.random() * 0.3,
        floatSpeed:  0.4  + Math.random() * 0.5,
        floatOffset: Math.random() * Math.PI * 2,
        baseY:       group.position.y,
        edgeMat,
      };

      scene.add(group);
      cubes.push(group);
    }
  }

  // Scattered free-floating cubes around the grid
  for (let i = 0; i < 18; i++) {
    const size = 0.25 + Math.random() * 0.9;
    const geo  = new THREE.BoxGeometry(size, size, size);

    const edgeColor = [GOLD, TEAL, PINK][Math.floor(Math.random() * 3)];
    const edgeMat   = new THREE.LineBasicMaterial({
      color: edgeColor,
      transparent: true,
      opacity: 0.2 + Math.random() * 0.5,
    });
    const cube = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat);

    cube.position.set(
      (Math.random() - 0.5) * 28,
      (Math.random() - 0.5) * 14,
      (Math.random() - 0.5) * 10 - 3
    );
    cube.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );

    cube.userData = {
      rx:          (Math.random() - 0.5) * 0.012,
      ry:          (Math.random() - 0.5) * 0.016,
      rz:          (Math.random() - 0.5) * 0.008,
      floatAmp:    0.1 + Math.random() * 0.35,
      floatSpeed:  0.3 + Math.random() * 0.6,
      floatOffset: Math.random() * Math.PI * 2,
      baseY:       cube.position.y,
      edgeMat,
    };

    scene.add(cube);
    cubes.push(cube);
  }

  // ── Resize ──
  function resize() {
    const w = canvas.offsetWidth  || window.innerWidth;
    const h = canvas.offsetHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  // ── Animate ──
  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.016;

    cubes.forEach(c => {
      const d = c.userData;
      c.rotation.x += d.rx;
      c.rotation.y += d.ry;
      if (d.rz) c.rotation.z += d.rz;
      c.position.y = d.baseY + Math.sin(t * d.floatSpeed + d.floatOffset) * d.floatAmp;

      // Pulse edge opacity
      if (d.edgeMat) {
        d.edgeMat.opacity = Math.max(0.15,
          d.edgeMat.opacity + Math.sin(t * 1.2 + d.floatOffset) * 0.003
        );
      }
    });

    // Slow camera drift
    camera.position.x = Math.sin(t * 0.05) * 1.2;
    camera.position.y = 6 + Math.sin(t * 0.07) * 0.5;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
  animate();
});

// ── Navbar scroll ──────────────────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// Hero content fade on scroll
const heroContent = document.querySelector('.hero-content');
window.addEventListener('scroll', () => {
  if (!heroContent) return;
  const y = window.scrollY;
  heroContent.style.opacity   = Math.max(0, 1 - y / 480);
  heroContent.style.transform = `translateY(${y * 0.09}px)`;
}, { passive: true });

// Mobile menu toggle
const toggle     = document.querySelector('.nav-toggle');
const mobileMenu = document.querySelector('.nav-mobile');
toggle?.addEventListener('click', () => mobileMenu.classList.toggle('open'));
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

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
