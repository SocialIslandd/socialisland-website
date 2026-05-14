// Load photo dynamically
const wrap = document.getElementById('photo-wrap');
if (wrap) {
  const img = new Image();
  img.src = 'foto.jpg';
  img.alt = 'Billy & Céline — Social Island';
  img.onload = () => { wrap.innerHTML = ''; wrap.appendChild(img); };
}

// ── Three.js Robot Hero ────────────────────────────────────────
window.addEventListener('load', () => {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type    = THREE.PCFSoftShadowMap;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);

  // ── Lighting ──
  scene.add(new THREE.AmbientLight(0x0a0a1a, 1.5));

  // Gold rim left
  const goldLight = new THREE.PointLight(0xC4924A, 3.5, 12);
  goldLight.position.set(-4, 4, 2);
  scene.add(goldLight);

  // Teal rim right
  const tealLight = new THREE.PointLight(0x4BACBA, 3, 12);
  tealLight.position.set(4, 3, 2);
  scene.add(tealLight);

  // Soft fill front
  const fillLight = new THREE.DirectionalLight(0x8888bb, 0.4);
  fillLight.position.set(0, 2, 6);
  scene.add(fillLight);

  // ── Stars ──
  const starGeo = new THREE.BufferGeometry();
  const sp      = new Float32Array(800 * 3);
  for (let i = 0; i < sp.length; i++) sp[i] = (Math.random() - 0.5) * 100;
  starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  scene.add(new THREE.Points(starGeo,
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.1, transparent: true, opacity: 0.45 })
  ));

  // ── Floor glow disc ──
  const discGeo = new THREE.CircleGeometry(1.4, 64);
  const discMat = new THREE.MeshBasicMaterial({
    color: 0x4BACBA, transparent: true, opacity: 0.08, side: THREE.DoubleSide,
  });
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = -0.01;
  scene.add(disc);

  // Ring around disc
  const ringGeo = new THREE.RingGeometry(1.38, 1.44, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x4BACBA, transparent: true, opacity: 0.35, side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0;
  scene.add(ring);

  // ── Floating particles around robot ──
  const partGeo = new THREE.BufferGeometry();
  const partPos = new Float32Array(60 * 3);
  const partVel = [];
  for (let i = 0; i < 60; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r     = 1.2 + Math.random() * 1.8;
    partPos[i * 3]     = Math.cos(angle) * r;
    partPos[i * 3 + 1] = Math.random() * 3.5;
    partPos[i * 3 + 2] = Math.sin(angle) * r;
    partVel.push({ angle, r, speed: (Math.random() - 0.5) * 0.008, vy: (Math.random() - 0.5) * 0.004, baseY: partPos[i * 3 + 1] });
  }
  partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3));
  const parts = new THREE.Points(partGeo,
    new THREE.PointsMaterial({ color: 0xC4924A, size: 0.06, transparent: true, opacity: 0.7 })
  );
  scene.add(parts);

  // ── Load Robot ──
  let headBone     = null;
  let mixer        = null;
  let robotLoaded  = false;

  const loader = new THREE.GLTFLoader();
  loader.load(
    'https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb',
    (gltf) => {
      const model = gltf.scene;
      model.scale.set(0.72, 0.72, 0.72);
      model.position.set(0, 0, 0);

      // Dark metallic skin + gold/teal emissive accents
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow    = true;
          child.receiveShadow = true;
          child.material = new THREE.MeshStandardMaterial({
            color:     0x0a0a12,
            metalness: 0.95,
            roughness: 0.15,
            emissive:  new THREE.Color(0x050510),
            emissiveIntensity: 0.5,
          });
        }
        if (child.isBone) {
          const n = child.name.toLowerCase();
          if (n.includes('head') && !n.includes('end') && !n.includes('top')) {
            headBone = child;
          }
        }
      });

      scene.add(model);
      robotLoaded = true;

      // Idle animation
      if (gltf.animations.length) {
        mixer = new THREE.AnimationMixer(model);
        const idle = THREE.AnimationClip.findByName(gltf.animations, 'Idle')
                  || gltf.animations[0];
        mixer.clipAction(idle).play();
      }
    },
    undefined,
    () => {
      // Fallback: simple placeholder robot from primitives
      buildFallbackRobot();
      robotLoaded = true;
    }
  );

  // ── Fallback robot (built-in primitives) ──
  function buildFallbackRobot() {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x0a0a14, metalness: 0.95, roughness: 0.15,
    });
    const group = new THREE.Group();

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.4), mat);
    torso.position.y = 1.1;
    group.add(torso);

    // Head group (for rotation)
    headBone = new THREE.Group();
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), mat);
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.1, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x4BACBA, emissive: 0x4BACBA, emissiveIntensity: 0.8 })
    );
    visor.position.set(0, 0.05, 0.18);
    headBone.add(head);
    headBone.add(visor);
    headBone.position.y = 1.75;
    group.add(headBone);

    // Neck
    group.add(Object.assign(
      new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.2, 12), mat),
      { position: new THREE.Vector3(0, 1.55, 0) }
    ));

    // Arms
    [-0.5, 0.5].forEach(x => {
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.5, 8, 8), mat);
      arm.position.set(x * 1.2, 1.1, 0);
      arm.rotation.z = x > 0 ? -0.3 : 0.3;
      group.add(arm);
    });

    // Legs
    [-0.18, 0.18].forEach(x => {
      const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.55, 8, 8), mat);
      leg.position.set(x, 0.42, 0);
      group.add(leg);
    });

    // Chest glow
    const chest = new THREE.Mesh(
      new THREE.CircleGeometry(0.1, 32),
      new THREE.MeshBasicMaterial({ color: 0xC4924A, transparent: true, opacity: 0.9 })
    );
    chest.position.set(0, 1.15, 0.21);
    group.add(chest);

    scene.add(group);
  }

  // ── Mouse tracking ──
  let mouseX = 0, mouseY = 0;
  let curRotY = 0, curRotX = 0;

  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });
  // Touch support
  window.addEventListener('touchmove', (e) => {
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
    // Adjust camera for mobile
    camera.position.set(0, 1.6, camera.aspect < 0.8 ? 7 : 5.5);
    camera.lookAt(0, 1.2, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  // ── Animate ──
  const clock = new THREE.Clock();
  let  t = 0;

  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    t += delta;

    if (mixer) mixer.update(delta);

    // Head follows cursor (smooth lerp)
    const tY = mouseX * 0.65;
    const tX = -mouseY * 0.3;
    curRotY += (tY - curRotY) * 0.045;
    curRotX += (tX - curRotX) * 0.045;
    if (headBone) {
      headBone.rotation.y = curRotY;
      headBone.rotation.x = curRotX;
    }

    // Pulse ring
    ring.material.opacity = 0.2 + Math.sin(t * 2) * 0.15;
    disc.material.opacity = 0.05 + Math.sin(t * 1.5) * 0.03;

    // Orbit particles
    const pp = partGeo.attributes.position.array;
    for (let i = 0; i < 60; i++) {
      partVel[i].angle += partVel[i].speed;
      pp[i * 3]     = Math.cos(partVel[i].angle) * partVel[i].r;
      pp[i * 3 + 1] = partVel[i].baseY + Math.sin(t * partVel[i].speed * 80) * 0.15;
      pp[i * 3 + 2] = Math.sin(partVel[i].angle) * partVel[i].r;
    }
    partGeo.attributes.position.needsUpdate = true;

    // Pulse lights
    goldLight.intensity = 3   + Math.sin(t * 1.1) * 0.5;
    tealLight.intensity = 2.8 + Math.sin(t * 0.9 + 1) * 0.5;

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
