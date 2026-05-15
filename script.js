import { animate, inView } from 'https://cdn.jsdelivr.net/npm/motion@11/+esm';

// ══════════════════════════════════════════════
//  WEBGL SHADER BACKGROUND
// ══════════════════════════════════════════════
(function initShader() {
  const canvas = document.getElementById('shader-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(new THREE.Color(0x000000));

  const scene  = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, -1);

  const vertexShader = `
    attribute vec3 position;
    void main() {
      gl_Position = vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    precision highp float;
    uniform vec2  resolution;
    uniform float time;
    uniform float xScale;
    uniform float yScale;
    uniform float distortion;

    void main() {
      vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);

      float d = length(p) * distortion;

      // Brand: gold offset, teal offset, white centre
      float goldX = p.x * (1.0 + d);
      float midX  = p.x;
      float tealX = p.x * (1.0 - d);

      float lineGold   = 0.08 / abs(p.y + sin((goldX + time) * xScale) * yScale);
      float lineMid    = 0.08 / abs(p.y + sin((midX  + time) * xScale) * yScale);
      float lineTeal   = 0.08 / abs(p.y + sin((tealX + time) * xScale) * yScale);

      // #E0B06A = gold,  #4BACBA = teal,  white centre blend
      vec3 gold = vec3(0.878, 0.690, 0.416);
      vec3 teal = vec3(0.294, 0.675, 0.729);
      vec3 white = vec3(1.0, 1.0, 1.0);

      vec3 col = gold * lineGold + white * lineMid * 0.4 + teal * lineTeal;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  const uniforms = {
    resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    time:       { value: 0.0 },
    xScale:     { value: 1.0 },
    yScale:     { value: 0.6 },
    distortion: { value: 0.08 },
  };

  const positions = new Float32Array([
    -1.0, -1.0, 0.0,
     1.0, -1.0, 0.0,
    -1.0,  1.0, 0.0,
     1.0, -1.0, 0.0,
    -1.0,  1.0, 0.0,
     1.0,  1.0, 0.0,
  ]);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.RawShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    side: THREE.DoubleSide,
  });

  scene.add(new THREE.Mesh(geometry, material));

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    uniforms.resolution.value.set(w, h);
  }
  resize();
  window.addEventListener('resize', resize);

  function loop() {
    uniforms.time.value += 0.01;
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  loop();
})();

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
//  NAVBAR
// ══════════════════════════════════════════════
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

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
//  REVEAL ANIMATIONS
// ══════════════════════════════════════════════
document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.opacity   = '0';
  el.style.transform = 'translateY(24px)';

  inView(el, () => {
    animate(el,
      { opacity: [0, 1], y: [24, 0] },
      { duration: 0.65, delay: (i % 4) * 0.06, easing: [0.25, 0.1, 0.25, 1] }
    );
  }, { margin: '0px 0px -40px 0px' });
});

// ══════════════════════════════════════════════
//  COUNTER ANIMATIONS
// ══════════════════════════════════════════════
function animateCounter(el) {
  const target    = parseInt(el.dataset.count, 10);
  const duration  = 1800;
  const startTime = performance.now();

  function update(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target);
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = target;
  }
  requestAnimationFrame(update);
}

document.querySelectorAll('[data-count]').forEach(el => {
  let done = false;
  inView(el, () => { if (!done) { done = true; animateCounter(el); } });
});

// ══════════════════════════════════════════════
//  SMOOTH SCROLL
// ══════════════════════════════════════════════
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});
