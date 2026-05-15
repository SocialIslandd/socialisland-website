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

      float rx = p.x * (1.0 + d);
      float gx = p.x;
      float bx = p.x * (1.0 - d);

      float r = 0.08 / abs(p.y + sin((rx + time) * xScale) * yScale);
      float g = 0.08 / abs(p.y + sin((gx + time) * xScale) * yScale);
      float b = 0.08 / abs(p.y + sin((bx + time) * xScale) * yScale);

      gl_FragColor = vec4(r, g, b, 1.0);
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
//  PROMPT BOX
// ══════════════════════════════════════════════
(function initPromptBox() {
  const form        = document.getElementById('prompt-form');
  const textarea    = document.getElementById('prompt-textarea');
  const sendBtn     = document.getElementById('prompt-send-btn');
  const fileInput   = document.getElementById('prompt-file');
  const attachBtn   = document.getElementById('prompt-attach-btn');
  const imgPreview  = document.getElementById('prompt-img-preview');
  const imgThumb    = document.getElementById('prompt-img-thumb');
  const imgRemove   = document.getElementById('prompt-img-remove');
  const toolsBtn    = document.getElementById('prompt-tools-btn');
  const toolsLabel  = document.getElementById('prompt-tools-label');
  const popover     = document.getElementById('prompt-popover');
  const activeTool  = document.getElementById('prompt-active-tool');
  const activeBtn   = document.getElementById('prompt-active-tool-btn');
  const activeLabel = document.getElementById('prompt-active-tool-label');
  const success     = document.getElementById('prompt-success');
  if (!form) return;

  let hasImage = false;

  // Auto-resize textarea
  function resizeTextarea() {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    updateSend();
  }
  textarea.addEventListener('input', resizeTextarea);

  function updateSend() {
    const hasVal = textarea.value.trim().length > 0 || hasImage;
    sendBtn.disabled = !hasVal;
  }

  // Attach image
  attachBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      imgThumb.src = reader.result;
      imgPreview.style.display = 'block';
      hasImage = true;
      updateSend();
    };
    reader.readAsDataURL(file);
    fileInput.value = '';
  });

  imgRemove.addEventListener('click', () => {
    imgPreview.style.display = 'none';
    imgThumb.src = '';
    hasImage = false;
    updateSend();
  });

  // Tools popover
  toolsBtn.addEventListener('click', e => {
    e.stopPropagation();
    const open = popover.style.display === 'block';
    popover.style.display = open ? 'none' : 'block';
  });
  document.addEventListener('click', () => { popover.style.display = 'none'; });
  popover.addEventListener('click', e => e.stopPropagation());

  document.querySelectorAll('.prompt-tool-item').forEach(item => {
    item.addEventListener('click', () => {
      const short = item.dataset.short;
      activeLabel.textContent = short;
      activeTool.style.display = 'flex';
      toolsLabel.style.display = 'none';
      popover.style.display = 'none';
    });
  });

  activeBtn.addEventListener('click', () => {
    activeTool.style.display = 'none';
    toolsLabel.style.display = 'inline';
  });

  // Submit
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (sendBtn.disabled) return;
    form.style.display = 'none';
    success.style.display = 'block';
  });
})();

// ══════════════════════════════════════════════
//  SMOOTH SCROLL
// ══════════════════════════════════════════════
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});
