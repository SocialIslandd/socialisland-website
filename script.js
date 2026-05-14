// Load photo dynamically
const photoWrap = document.getElementById('photo-wrap');
if (photoWrap) {
  const img = new Image();
  img.src = 'foto.jpg';
  img.alt = 'Billy & Céline — Social Island';
  img.onload = () => { photoWrap.innerHTML = ''; photoWrap.appendChild(img); };
}

// ══════════════════════════════════════════════
//  INTRO — Fullscreen Robotic Eye (Three.js)
// ══════════════════════════════════════════════
(function initIntro() {
  const canvas  = document.getElementById('intro-canvas');
  const loading = document.getElementById('intro-loading');
  const scrollHint = document.getElementById('intro-scroll');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x04040e, 1);
  renderer.shadowMap.enabled = true;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
  camera.position.set(0, 0.5, 7);

  // Lighting — strong so the metallic materials catch it
  scene.add(new THREE.AmbientLight(0x223344, 3));

  const tealLight = new THREE.PointLight(0x4BACBA, 18, 25);
  tealLight.position.set(-4, 2, 4);
  scene.add(tealLight);

  const goldLight = new THREE.PointLight(0xC4924A, 14, 25);
  goldLight.position.set(4, -1, 4);
  scene.add(goldLight);

  const frontLight = new THREE.DirectionalLight(0xaabbcc, 2.5);
  frontLight.position.set(0, 1, 6);
  scene.add(frontLight);

  const topLight = new THREE.PointLight(0xffffff, 6, 15);
  topLight.position.set(0, 5, 3);
  scene.add(topLight);

  // Stars
  const starPos = new Float32Array(1200 * 3);
  for (let i = 0; i < starPos.length; i++) starPos[i] = (Math.random() - 0.5) * 80;
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  scene.add(new THREE.Points(starGeo,
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.08, transparent: true, opacity: 0.5 })
  ));

  // Mouse tracking state
  let mouseX = 0, mouseY = 0;
  let curRotY = 0, curRotX = 0;
  let model = null;

  window.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });
  window.addEventListener('touchmove', e => {
    if (!e.touches[0]) return;
    mouseX = (e.touches[0].clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.touches[0].clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  // Load the robotic eye
  const loader = new THREE.GLTFLoader();
  loader.load(
    'robot.glb',
    (gltf) => {
      model = gltf.scene;

      // Centre & scale — robot fills the viewport height
      const box    = new THREE.Box3().setFromObject(model);
      const size   = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale  = 5.5 / maxDim;          // tall enough to fill screen
      model.scale.setScalar(scale);
      model.position.copy(center.multiplyScalar(-scale)); // centre it
      model.position.y -= 0.5;              // shift slightly down

      // Keep original textures but boost visibility with env lighting
      model.traverse(child => {
        if (child.isMesh) {
          child.castShadow    = true;
          child.receiveShadow = true;
          if (child.material) {
            // Boost existing materials
            child.material.metalness  = Math.max(child.material.metalness  || 0, 0.6);
            child.material.roughness  = Math.min(child.material.roughness  ?? 1, 0.4);
            child.material.emissive   = child.material.emissive || new THREE.Color(0x111122);
            child.material.emissiveIntensity = 0.18;
            child.material.needsUpdate = true;
          }
        }
      });

      scene.add(model);

      // Hide loading, show scroll hint
      loading.classList.add('hidden');
      setTimeout(() => scrollHint.classList.add('visible'), 800);
    },
    undefined,
    (err) => {
      console.warn('GLB load error:', err);
      loading.classList.add('hidden');
    }
  );

  // Resize
  function resize() {
    const w = canvas.offsetWidth  || window.innerWidth;
    const h = canvas.offsetHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  // Animate
  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.016;

    if (model) {
      // Whole robot subtly turns toward cursor
      curRotY += (mouseX * 0.35  - curRotY) * 0.03;
      curRotX += (-mouseY * 0.15 - curRotX) * 0.03;
      model.rotation.y = curRotY;
      model.rotation.x = curRotX;

      // Subtle idle float
      model.position.y += (Math.sin(t * 0.5) * 0.05 - model.position.y) * 0.02;
    }

    // Pulse lights
    tealLight.intensity = 17 + Math.sin(t * 1.3) * 3;
    goldLight.intensity = 13 + Math.sin(t * 0.9 + 1.2) * 2;

    renderer.render(scene, camera);
  }
  animate();

  // Stop rendering when intro scrolled out of view (performance)
  const introEl = document.getElementById('intro');
  const introObserver = new IntersectionObserver(
    ([entry]) => { renderer.setAnimationLoop(entry.isIntersecting ? null : null); },
    { threshold: 0 }
  );
  if (introEl) introObserver.observe(introEl);
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
//  NAVBAR + SCROLL EFFECTS
// ══════════════════════════════════════════════
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

const heroContent = document.querySelector('.hero-content');
window.addEventListener('scroll', () => {
  if (!heroContent) return;
  // Offset for intro height
  const introH = document.getElementById('intro')?.offsetHeight || 0;
  const y = Math.max(0, window.scrollY - introH);
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
