// ══════════════════════════════════════════════
//  MESH GRADIENT BACKGROUND
// ══════════════════════════════════════════════
(function initShader() {
  const canvas = document.getElementById('shader-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

  const scene  = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const vertexShader = `
    attribute vec3 position;
    void main() { gl_Position = vec4(position, 1.0); }
  `;

  const fragmentShader = `
    precision mediump float;
    uniform vec2  resolution;
    uniform float time;

    float blob(vec2 uv, vec2 center, float radius) {
      return exp(-distance(uv, center) / radius);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / resolution.xy;
      float t = time * 0.12;

      // 5 slowly drifting colour points
      vec2 p1 = vec2(0.20 + 0.18 * sin(t * 0.60), 0.55 + 0.20 * cos(t * 0.45));
      vec2 p2 = vec2(0.75 + 0.15 * cos(t * 0.50), 0.25 + 0.18 * sin(t * 0.55));
      vec2 p3 = vec2(0.50 + 0.22 * sin(t * 0.70 + 1.0), 0.80 + 0.12 * cos(t * 0.65));
      vec2 p4 = vec2(0.85 + 0.10 * cos(t * 0.80), 0.70 + 0.18 * sin(t * 0.40));
      vec2 p5 = vec2(0.35 + 0.20 * sin(t * 0.55 + 2.0), 0.20 + 0.15 * cos(t * 0.75));

      float b1 = blob(uv, p1, 0.28);
      float b2 = blob(uv, p2, 0.24);
      float b3 = blob(uv, p3, 0.22);
      float b4 = blob(uv, p4, 0.20);
      float b5 = blob(uv, p5, 0.26);

      // White/silver colour per blob — matches black/white site
      vec3 c1 = vec3(0.95, 0.95, 1.00) * b1;
      vec3 c2 = vec3(0.80, 0.88, 1.00) * b2;
      vec3 c3 = vec3(0.90, 0.90, 0.95) * b3;
      vec3 c4 = vec3(0.75, 0.85, 1.00) * b4;
      vec3 c5 = vec3(0.92, 0.92, 0.98) * b5;

      vec3 col = (c1 + c2 + c3 + c4 + c5) * 0.22;
      col = clamp(col, 0.0, 1.0);

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  const uniforms = {
    resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    time:       { value: 0.0 },
  };

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(
    new Float32Array([-1,-1,0, 1,-1,0, -1,1,0, 1,-1,0, -1,1,0, 1,1,0]), 3
  ));
  const mat = new THREE.RawShaderMaterial({ vertexShader, fragmentShader, uniforms });
  scene.add(new THREE.Mesh(geo, mat));

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    uniforms.resolution.value.set(w, h);
  }
  resize();
  window.addEventListener('resize', resize);

  function loop() {
    uniforms.time.value += 0.016;
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
//  REVEAL ANIMATIONS (native IntersectionObserver)
// ══════════════════════════════════════════════
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    }
  });
}, { rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => {
  revealObserver.observe(el);
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

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
});
document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));

// ══════════════════════════════════════════════
//  ORBITAL TIMELINE
// ══════════════════════════════════════════════
(function initOrbital() {
  const wrap = document.getElementById('orbital-wrap');
  if (!wrap) return;

  const icons = {
    workflow: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>`,
    funnel:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>`,
    ai:       `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1" fill="currentColor"/></svg>`,
    ads:      `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v4H3zM3 10h18v4H3zM3 17h18v4H3z"/></svg>`,
  };

  const services = [
    {
      id: 0, icon: icons.workflow,
      title: 'AI Workflows',
      fullTitle: 'AI Workflows & Automatisaties',
      desc: 'Slimme AI-systemen die je repetitieve taken automatiseren. Van content generatie tot klantopvolging, volledig op autopiloot.',
      tags: ['Make.com', 'n8n', 'Zapier'],
      status: 'done', energy: 95, related: [1, 3]
    },
    {
      id: 1, icon: icons.funnel,
      title: 'Slimme Funnels',
      fullTitle: 'Slimme Funnels',
      desc: 'High-converting funnels gebouwd met de juiste tech stack. Van opt-in tot checkout, elk onderdeel geoptimaliseerd.',
      tags: ['GoHighLevel', 'ClickFunnels', 'Systeme.io'],
      status: 'done', energy: 88, related: [0, 2]
    },
    {
      id: 2, icon: icons.ai,
      title: 'AI Tools',
      fullTitle: 'AI Tools Implementatie',
      desc: 'Wij integreren de juiste AI tools in jouw bestaande business. Van chatbots en agents tot volledige content engines.',
      tags: ['Claude API', 'OpenAI', 'Voiceflow'],
      status: 'active', energy: 72, related: [1, 3]
    },
    {
      id: 3, icon: icons.ads,
      title: 'Advertenties',
      fullTitle: 'Advertentie Back-end',
      desc: 'Technisch opzetten van Meta & Google advertenties. Pixels, tracking, retargeting en koppelingen, foutloos geconfigureerd.',
      tags: ['Meta Ads', 'Google Ads', 'GTM'],
      status: 'done', energy: 80, related: [0, 2]
    },
  ];

  const RADIUS = 170;
  let angle   = 0;
  let autoRot = true;
  let activeId = null;
  let rafId;

  // Build node elements
  const nodeEls = services.map(s => {
    const node = document.createElement('div');
    node.className = 'orbital-node';
    node.dataset.id = s.id;

    const halo = document.createElement('div');
    halo.className = 'orbital-node-halo';
    const haloSize = s.energy * 0.5 + 40;
    halo.style.cssText = `width:${haloSize}px;height:${haloSize}px;`;

    const dot = document.createElement('div');
    dot.className = 'orbital-node-dot';
    dot.innerHTML = s.icon;

    const label = document.createElement('div');
    label.className = 'orbital-node-label';
    label.textContent = s.title;

    node.append(halo, dot, label);
    wrap.appendChild(node);

    node.addEventListener('click', e => {
      e.stopPropagation();
      if (activeId === s.id) {
        closeAll();
      } else {
        openNode(s.id);
      }
    });
    return node;
  });

  function openNode(id) {
    activeId = id;
    autoRot  = false;
    updateClasses();
    renderCard(id);
  }

  function closeAll() {
    activeId = null;
    autoRot  = true;
    updateClasses();
    document.querySelectorAll('.orbital-card').forEach(c => c.remove());
  }

  wrap.addEventListener('click', e => {
    if (e.target === wrap || e.target.classList.contains('orbital-ring') || e.target.classList.contains('orbital-center') || e.target.classList.contains('orbital-core')) {
      closeAll();
    }
  });

  function updateClasses() {
    const activeService = services.find(s => s.id === activeId);
    nodeEls.forEach(el => {
      const id = parseInt(el.dataset.id);
      el.classList.remove('active', 'related');
      if (id === activeId) el.classList.add('active');
      else if (activeService && activeService.related.includes(id)) el.classList.add('related');
    });
  }

  function renderCard(id) {
    document.querySelectorAll('.orbital-card').forEach(c => c.remove());
    const s = services[id];
    const badgeClass = s.status === 'done' ? 'badge-done' : s.status === 'active' ? 'badge-active' : 'badge-soon';
    const badgeLabel = s.status === 'done' ? 'BESCHIKBAAR' : s.status === 'active' ? 'ACTIEF' : 'BINNENKORT';
    const card = document.createElement('div');
    card.className = 'orbital-card';
    card.innerHTML = `
      <div class="orbital-card-top">
        <span class="orbital-card-badge ${badgeClass}">${badgeLabel}</span>
      </div>
      <div class="orbital-card-title">${s.fullTitle}</div>
      <div class="orbital-card-text">${s.desc}</div>
      <div class="orbital-card-tags">${s.tags.map(t => `<span>${t}</span>`).join('')}</div>
    `;
    card.addEventListener('click', e => e.stopPropagation());
    nodeEls[id].appendChild(card);
  }

  function positionNodes() {
    const total = services.length;
    nodeEls.forEach((el, i) => {
      const a = ((i / total) * 360 + angle) % 360;
      const rad = (a * Math.PI) / 180;
      const x = RADIUS * Math.cos(rad);
      const y = RADIUS * Math.sin(rad);
      const opacity = el.classList.contains('active') ? 1 : Math.max(0.4, 0.4 + 0.6 * ((1 + Math.sin(rad)) / 2));
      el.style.transform = `translate(${x}px, ${y}px)`;
      if (!el.classList.contains('active')) el.style.opacity = opacity;
      else el.style.opacity = 1;
    });
  }

  function loop() {
    if (autoRot) angle = (angle + 0.3) % 360;
    positionNodes();
    rafId = requestAnimationFrame(loop);
  }
  loop();
})();

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
