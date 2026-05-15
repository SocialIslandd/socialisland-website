
// ══════════════════════════════════════════════
//  SHADER BACKGROUND (raw WebGL, no CDN)
//  Plasma lines — shader-background.tsx → vanilla
// ══════════════════════════════════════════════
(function initShaderBackground() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) { canvas.style.background = '#0d0a1e'; return; }

  const vs = `
    attribute vec2 a_pos;
    void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
  `;

  const fs = `
    precision highp float;
    uniform vec2  iResolution;
    uniform float iTime;

    const float overallSpeed       = 0.2;
    const float gridSmoothWidth    = 0.015;
    const float axisWidth          = 0.05;
    const float majorLineWidth     = 0.025;
    const float minorLineWidth     = 0.0125;
    const float majorLineFrequency = 5.0;
    const float minorLineFrequency = 1.0;
    const float scale              = 5.0;
    const vec4  lineColor          = vec4(0.4, 0.2, 0.8, 1.0);
    const float minLineWidth       = 0.01;
    const float maxLineWidth       = 0.2;
    const float lineSpeed          = 1.0 * overallSpeed;
    const float lineAmplitude      = 1.0;
    const float lineFrequency      = 0.2;
    const float warpSpeed          = 0.2 * overallSpeed;
    const float warpFrequency      = 0.5;
    const float warpAmplitude      = 1.0;
    const float offsetFrequency    = 0.5;
    const float offsetSpeed        = 1.33 * overallSpeed;
    const float minOffsetSpread    = 0.6;
    const float maxOffsetSpread    = 2.0;
    const int   linesPerGroup      = 16;

    #define drawCircle(pos, radius, coord) smoothstep(radius + gridSmoothWidth, radius, length(coord - (pos)))
    #define drawSmoothLine(pos, halfWidth, t) smoothstep(halfWidth, 0.0, abs(pos - (t)))
    #define drawCrispLine(pos, halfWidth, t) smoothstep(halfWidth + gridSmoothWidth, halfWidth, abs(pos - (t)))
    #define drawPeriodicLine(freq, width, t) drawCrispLine(freq / 2.0, width, abs(mod(t, freq) - (freq) / 2.0))

    float random(float t) {
      return (cos(t) + cos(t * 1.3 + 1.3) + cos(t * 1.4 + 1.4)) / 3.0;
    }

    float getPlasmaY(float x, float horizontalFade, float offset) {
      return random(x * lineFrequency + iTime * lineSpeed) * horizontalFade * lineAmplitude + offset;
    }

    void main() {
      vec2 uv    = gl_FragCoord.xy / iResolution.xy;
      vec2 space = (gl_FragCoord.xy - iResolution.xy / 2.0) / iResolution.x * 2.0 * scale;

      float horizontalFade = 1.0 - (cos(uv.x * 6.28) * 0.5 + 0.5);
      float verticalFade   = 1.0 - (cos(uv.y * 6.28) * 0.5 + 0.5);

      space.y += random(space.x * warpFrequency + iTime * warpSpeed) * warpAmplitude * (0.5 + horizontalFade);
      space.x += random(space.y * warpFrequency + iTime * warpSpeed + 2.0) * warpAmplitude * horizontalFade;

      vec4 lines    = vec4(0.0);
      vec4 bgColor1 = vec4(0.1, 0.1, 0.3, 1.0);
      vec4 bgColor2 = vec4(0.3, 0.1, 0.5, 1.0);

      for (int l = 0; l < 16; l++) {
        float normalizedLineIndex = float(l) / float(linesPerGroup);
        float offsetTime          = iTime * offsetSpeed;
        float offsetPosition      = float(l) + space.x * offsetFrequency;
        float rand     = random(offsetPosition + offsetTime) * 0.5 + 0.5;
        float halfWidth = mix(minLineWidth, maxLineWidth, rand * horizontalFade) / 2.0;
        float offset    = random(offsetPosition + offsetTime * (1.0 + normalizedLineIndex))
                          * mix(minOffsetSpread, maxOffsetSpread, horizontalFade);
        float linePosition = getPlasmaY(space.x, horizontalFade, offset);
        float line = drawSmoothLine(linePosition, halfWidth, space.y) / 2.0
                   + drawCrispLine(linePosition, halfWidth * 0.15, space.y);

        float circleX = mod(float(l) + iTime * lineSpeed, 25.0) - 12.0;
        vec2  circlePosition = vec2(circleX, getPlasmaY(circleX, horizontalFade, offset));
        float circle = drawCircle(circlePosition, 0.01, space) * 4.0;

        lines += (line + circle) * lineColor * rand;
      }

      vec4 fragColor  = mix(bgColor1, bgColor2, uv.x);
      fragColor      *= verticalFade;
      fragColor.a     = 1.0;
      fragColor      += lines;

      gl_FragColor = fragColor;
    }
  `;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('Shader error:', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('Program link error:', gl.getProgramInfoLog(prog));
    return;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

  const aPos  = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uRes  = gl.getUniformLocation(prog, 'iResolution');
  const uTime = gl.getUniformLocation(prog, 'iTime');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener('resize', resize);

  const startTime = Date.now();
  function loop() {
    gl.uniform1f(uTime, (Date.now() - startTime) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(loop);
  }
  loop();
})();

// ══════════════════════════════════════════════
//  GLSL HILLS OVERLAY (raw WebGL, no CDN)
//  Port of glsl-hills.tsx — layers over plasma bg
// ══════════════════════════════════════════════
(function initGLSLHills() {
  const canvas = document.getElementById('hills-canvas');
  if (!canvas) return;
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false })
           || canvas.getContext('experimental-webgl', { alpha: true, premultipliedAlpha: false });
  if (!gl) return;

  // uint32 indices needed for 257×257 = 66049 verts (> uint16 max 65535)
  const ext32 = gl.getExtension('OES_element_index_uint');
  const SEGS  = ext32 ? 256 : 128; // fallback to 128 if extension missing
  const PSIZE = 256;

  // ── Plane geometry (THREE.PlaneGeometry(256,256,SEGS,SEGS)) ──
  const vCount = (SEGS + 1) * (SEGS + 1);
  const positions = new Float32Array(vCount * 3);
  for (let iy = 0, vi = 0; iy <= SEGS; iy++) {
    for (let ix = 0; ix <= SEGS; ix++) {
      positions[vi++] = (ix / SEGS - 0.5) * PSIZE;   // x: -128…128
      positions[vi++] = (0.5 - iy / SEGS) * PSIZE;   // y: 128…-128 (Three.js reverses y)
      positions[vi++] = 0;
    }
  }

  const iCount  = SEGS * SEGS * 6;
  const IdxArr  = ext32 ? Uint32Array : Uint16Array;
  const GL_IDX  = ext32 ? 0x1405 /* UNSIGNED_INT */ : gl.UNSIGNED_SHORT;
  const indices = new IdxArr(iCount);
  for (let iy = 0, ii = 0; iy < SEGS; iy++) {
    for (let ix = 0; ix < SEGS; ix++) {
      const a = iy * (SEGS + 1) + ix;
      const b = a + (SEGS + 1);
      const c = b + 1;
      const d = a + 1;
      indices[ii++] = a; indices[ii++] = b; indices[ii++] = d;
      indices[ii++] = b; indices[ii++] = c; indices[ii++] = d;
    }
  }

  // ── Shaders (identical to component) ──
  const vs = `
    attribute vec3 position;
    uniform mat4 projectionMatrix;
    uniform mat4 modelViewMatrix;
    uniform float time;
    varying vec3 vPosition;

    mat4 rotateMatrixX(float r) {
      return mat4(
        1.0,0.0,0.0,0.0,
        0.0,cos(r),-sin(r),0.0,
        0.0,sin(r),cos(r),0.0,
        0.0,0.0,0.0,1.0);
    }
    vec3 mod289v3(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
    vec4 mod289v4(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
    vec4 permute(vec4 x){return mod289v4(((x*34.0)+1.0)*x);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
    vec3 fade(vec3 t){return t*t*t*(t*(t*6.0-15.0)+10.0);}

    float cnoise(vec3 P){
      vec3 Pi0=floor(P); vec3 Pi1=Pi0+vec3(1.0);
      Pi0=mod289v3(Pi0); Pi1=mod289v3(Pi1);
      vec3 Pf0=fract(P); vec3 Pf1=Pf0-vec3(1.0);
      vec4 ix=vec4(Pi0.x,Pi1.x,Pi0.x,Pi1.x);
      vec4 iy=vec4(Pi0.yy,Pi1.yy);
      vec4 iz0=Pi0.zzzz; vec4 iz1=Pi1.zzzz;
      vec4 ixy=permute(permute(ix)+iy);
      vec4 ixy0=permute(ixy+iz0); vec4 ixy1=permute(ixy+iz1);
      vec4 gx0=ixy0*(1.0/7.0);
      vec4 gy0=fract(floor(gx0)*(1.0/7.0))-0.5;
      gx0=fract(gx0);
      vec4 gz0=vec4(0.5)-abs(gx0)-abs(gy0);
      vec4 sz0=step(gz0,vec4(0.0));
      gx0-=sz0*(step(0.0,gx0)-0.5);
      gy0-=sz0*(step(0.0,gy0)-0.5);
      vec4 gx1=ixy1*(1.0/7.0);
      vec4 gy1=fract(floor(gx1)*(1.0/7.0))-0.5;
      gx1=fract(gx1);
      vec4 gz1=vec4(0.5)-abs(gx1)-abs(gy1);
      vec4 sz1=step(gz1,vec4(0.0));
      gx1-=sz1*(step(0.0,gx1)-0.5);
      gy1-=sz1*(step(0.0,gy1)-0.5);
      vec3 g000=vec3(gx0.x,gy0.x,gz0.x); vec3 g100=vec3(gx0.y,gy0.y,gz0.y);
      vec3 g010=vec3(gx0.z,gy0.z,gz0.z); vec3 g110=vec3(gx0.w,gy0.w,gz0.w);
      vec3 g001=vec3(gx1.x,gy1.x,gz1.x); vec3 g101=vec3(gx1.y,gy1.y,gz1.y);
      vec3 g011=vec3(gx1.z,gy1.z,gz1.z); vec3 g111=vec3(gx1.w,gy1.w,gz1.w);
      vec4 norm0=taylorInvSqrt(vec4(dot(g000,g000),dot(g010,g010),dot(g100,g100),dot(g110,g110)));
      g000*=norm0.x; g010*=norm0.y; g100*=norm0.z; g110*=norm0.w;
      vec4 norm1=taylorInvSqrt(vec4(dot(g001,g001),dot(g011,g011),dot(g101,g101),dot(g111,g111)));
      g001*=norm1.x; g011*=norm1.y; g101*=norm1.z; g111*=norm1.w;
      float n000=dot(g000,Pf0);
      float n100=dot(g100,vec3(Pf1.x,Pf0.yz));
      float n010=dot(g010,vec3(Pf0.x,Pf1.y,Pf0.z));
      float n110=dot(g110,vec3(Pf1.xy,Pf0.z));
      float n001=dot(g001,vec3(Pf0.xy,Pf1.z));
      float n101=dot(g101,vec3(Pf1.x,Pf0.y,Pf1.z));
      float n011=dot(g011,vec3(Pf0.x,Pf1.yz));
      float n111=dot(g111,Pf1);
      vec3 fade_xyz=fade(Pf0);
      vec4 n_z=mix(vec4(n000,n100,n010,n110),vec4(n001,n101,n011,n111),fade_xyz.z);
      vec2 n_yz=mix(n_z.xy,n_z.zw,fade_xyz.y);
      return 2.2*mix(n_yz.x,n_yz.y,fade_xyz.x);
    }

    void main(){
      vec3 p=(rotateMatrixX(radians(90.0))*vec4(position,1.0)).xyz;
      float s=sin(radians(p.x/128.0*90.0));
      vec3 np=p+vec3(0.0,0.0,time*-30.0);
      float n1=cnoise(np*0.08);
      float n2=cnoise(np*0.06);
      float n3=cnoise(np*0.4);
      vec3 lp=p+vec3(0.0,
        n1*s*8.0+n2*s*8.0+n3*(abs(s)*2.0+0.5)+pow(s,2.0)*40.0,
        0.0);
      vPosition=lp;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(lp,1.0);
    }
  `;

  const fs = `
    precision highp float;
    varying vec3 vPosition;
    void main(){
      float opacity=(96.0-length(vPosition))/256.0*0.6;
      gl_FragColor=vec4(vec3(0.85),max(opacity,0.0));
    }
  `;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('Hills shader error:', gl.getShaderInfoLog(s));
      gl.deleteShader(s); return null;
    }
    return s;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('Hills link error:', gl.getProgramInfoLog(prog)); return;
  }
  gl.useProgram(prog);

  // Buffers
  const posBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  const idxBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  const aPos  = gl.getAttribLocation(prog, 'position');
  const uProj = gl.getUniformLocation(prog, 'projectionMatrix');
  const uMV   = gl.getUniformLocation(prog, 'modelViewMatrix');
  const uTime = gl.getUniformLocation(prog, 'time');

  gl.enableVertexAttribArray(aPos);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  // ── Matrix helpers ──
  function mat4Perspective(fovY, aspect, near, far) {
    const f  = 1.0 / Math.tan(fovY * 0.5);
    const nf = 1.0 / (near - far);
    return new Float32Array([
      f/aspect, 0, 0,  0,
      0,        f, 0,  0,
      0,        0, (far+near)*nf,  -1,
      0,        0, 2*far*near*nf,   0
    ]);
  }

  function mat4LookAt(ex,ey,ez, cx,cy,cz, ux,uy,uz) {
    // forward
    let fx=cx-ex, fy=cy-ey, fz=cz-ez;
    const fl=Math.sqrt(fx*fx+fy*fy+fz*fz);
    fx/=fl; fy/=fl; fz/=fl;
    // right = cross(forward, up)
    let rx=fy*uz-fz*uy, ry=fz*ux-fx*uz, rz=fx*uy-fy*ux;
    const rl=Math.sqrt(rx*rx+ry*ry+rz*rz);
    rx/=rl; ry/=rl; rz/=rl;
    // up = cross(right, forward)
    const ux2=ry*fz-rz*fy, uy2=rz*fx-rx*fz, uz2=rx*fy-ry*fx;
    return new Float32Array([
      rx,  ux2, -fx, 0,
      ry,  uy2, -fy, 0,
      rz,  uz2, -fz, 0,
      -(rx*ex+ry*ey+rz*ez),
      -(ux2*ex+uy2*ey+uz2*ez),
       (fx*ex+fy*ey+fz*ez), 1
    ]);
  }

  // Camera (matches component defaults)
  const mv = mat4LookAt(0,16,125, 0,28,0, 0,1,0);
  gl.uniformMatrix4fv(uMV, false, mv);

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniformMatrix4fv(uProj, false,
      mat4Perspective(Math.PI/4, canvas.width/canvas.height, 1, 10000));
  }
  window.addEventListener('resize', resize);
  resize();

  const startTime = Date.now();
  const speed = 0.5;
  function loop() {
    const t = (Date.now() - startTime) / 1000 * speed;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    gl.uniform1f(uTime, t);
    gl.drawElements(gl.TRIANGLES, iCount, GL_IDX, 0);
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
