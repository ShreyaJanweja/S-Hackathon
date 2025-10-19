/* main.js - Cosmic Sparks theme
   - starfield with twinkle & connect lines (constellation)
   - small mini-constellation canvas
   - GSAP entrance animations
   - mobile navbar + smooth scroll
   - EmailJS contact (replace keys)
*/

/* ---------- Utility ---------- */
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

/* ---------- NAVBAR mobile toggle & smooth scroll ---------- */
const menuBtn = document.getElementById('menu-btn');
const navMenu = document.getElementById('nav-menu');
if (menuBtn && navMenu) {
  menuBtn.addEventListener('click', () => navMenu.classList.toggle('hidden'));
}
document.addEventListener('click', (e) => {
  if (!e.target.closest('#menu-btn') && !e.target.closest('#nav-menu')) {
    if (navMenu && !navMenu.classList.contains('hidden')) navMenu.classList.add('hidden');
  }
});
$$('a[href^="#"], a[href$=".html"], .nav-link').forEach(a => {
  a.addEventListener('click', (ev) => {
    // let links behave normally if they go to other pages; otherwise smooth scroll for same-page anchors
    const href = a.getAttribute('href');
    if (href && href.startsWith('#')) {
      ev.preventDefault();
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (href && href.endsWith('.html')) {
      // Preload the next page to avoid flash
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      document.head.appendChild(link);
    }
  });
});

/* ---------- GSAP section reveals ---------- */
if (typeof gsap !== 'undefined') {
  gsap.utils.toArray('section, .glass-card, .p-6').forEach((el, i) => {
    gsap.from(el, {
      y: 18,
      opacity: 0,
      duration: 0.9,
      delay: 0.12 + (i * 0.05),
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
      }
    });
  });
}

/* ---------- Starfield Canvas ---------- */
(function(){
  const canvas = document.getElementById('stars-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w = canvas.width = innerWidth;
  let h = canvas.height = innerHeight;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = w * DPR;
  canvas.height = h * DPR;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  ctx.scale(DPR, DPR);

  const STAR_COUNT = Math.floor((w*h)/10000); // density
  const stars = [];
  const maxLinkDistance = 120;
  const mouse = { x: -9999, y: -9999 };

  function rand(min, max){ return Math.random()*(max-min)+min; }

  function createStar(i){
    return {
      id: i,
      x: Math.random()*w,
      y: Math.random()*h,
      vx: (Math.random()-0.5)*0.15,
      vy: (Math.random()-0.5)*0.15,
      r: Math.random()*1.6 + 0.3,
      alpha: Math.random()*0.8 + 0.2,
      twinkleOffset: Math.random()*Math.PI*2
    };
  }
  for(let i=0;i<STAR_COUNT;i++) stars.push(createStar(i));

  // update/rescale on resize
  function resize(){ 
    w = canvas.width = innerWidth*DPR;
    h = canvas.height = innerHeight*DPR;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize);

  // mouse parallax
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  window.addEventListener('mouseleave', ()=> { mouse.x = -9999; mouse.y = -9999; });

  // animation loop
  let t = 0;
  function draw(){
    t += 0.01;
    ctx.clearRect(0,0,innerWidth,innerHeight);

    // draw glow background subtle gradient
    const grad = ctx.createLinearGradient(0,0,innerWidth,innerHeight);
    grad.addColorStop(0, 'rgba(7,10,42,0.12)');
    grad.addColorStop(1, 'rgba(18,4,39,0.12)');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,innerWidth,innerHeight);

    // update + draw stars
    for(let i=0;i<stars.length;i++){
      const s = stars[i];
      // twinkle
      const tw = 0.6 + Math.sin(t*2 + s.twinkleOffset)*0.4;
      ctx.globalAlpha = s.alpha * tw;

      // position update
      s.x += s.vx;
      s.y += s.vy;

      // slight parallax toward mouse
      const dx = (mouse.x - innerWidth/2)/200;
      const dy = (mouse.y - innerHeight/2)/200;
      const px = s.x + dx*(s.r*0.6);
      const py = s.y + dy*(s.r*0.6);

      // draw star
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${0.9})`;
      ctx.arc(px, py, s.r, 0, Math.PI*2);
      ctx.fill();

      // wrap edges
      if (s.x < -10) s.x = innerWidth + 10;
      if (s.x > innerWidth + 10) s.x = -10;
      if (s.y < -10) s.y = innerHeight + 10;
      if (s.y > innerHeight + 10) s.y = -10;
    }

    // draw connecting lines (constellation-like)
    ctx.globalCompositeOperation = 'lighter';
    for(let i=0;i<stars.length;i++){
      for(let j=i+1;j<i+6 && j<stars.length;j++){ // only connect to some neighbors for perf
        const a = stars[i];
        const b = stars[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx*dx+dy*dy);
        if (dist < maxLinkDistance){
          const alpha = 0.12 * (1 - dist/maxLinkDistance);
          ctx.strokeStyle = `rgba(96,165,250,${alpha})`; // cyan-ish
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ---------- Mini constellation inside hero card ---------- */
(function(){
  const mini = document.getElementById('mini-constellation');
  if (!mini) return;
  const ctx = mini.getContext('2d');
  function fit() {
    mini.width = mini.clientWidth * devicePixelRatio;
    mini.height = mini.clientHeight * devicePixelRatio;
    ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
  }
  fit();
  window.addEventListener('resize', fit);

  // create a small cluster of points arranged roughly into a gear/lamp shape
  const points = [];
  for (let i=0;i<12;i++){
    const ang = (i/12)*Math.PI*2;
    const r = 18 + (i%2?6:0);
    const cx = mini.clientWidth/2 + Math.cos(ang)*r;
    const cy = mini.clientHeight/2 + Math.sin(ang)*r;
    points.push({x:cx,y:cy, ox:cx, oy:cy, phase: Math.random()*Math.PI*2});
  }
  function drawMini(t=0){
    ctx.clearRect(0,0,mini.width,mini.height);
    // soft background
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.fillRect(0,0,mini.clientWidth,mini.clientHeight);

    // connect
    ctx.strokeStyle = 'rgba(139,92,246,0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i=0;i<points.length;i++){
      const p = points[i];
      const nx = p.ox + Math.sin(t + p.phase)*4;
      const ny = p.oy + Math.cos(t + p.phase)*4;
      if (i===0) ctx.moveTo(nx,ny); else ctx.lineTo(nx,ny);
      p.x = nx; p.y = ny;
    }
    ctx.closePath();
    ctx.stroke();

    // points
    for (let p of points){
      ctx.beginPath();
      ctx.fillStyle = 'rgba(6,182,212,0.95)';
      ctx.arc(p.x, p.y, 2.2, 0, Math.PI*2);
      ctx.fill();
    }
    requestAnimationFrame((ts)=> drawMini(ts*0.002));
  }
  drawMini();
})();

/* ---------- Contact form (EmailJS) ---------- */
/* Note: Replace 'YOUR_PUBLIC_KEY', 'YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID' */
(function(){
  const form = document.querySelector('form');
  if (!form) return;
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const formData = new FormData(form);
    // show small loading
    const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('button');
    const oldText = submitBtn?.innerHTML;
    if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = 'Sending...'; }

    // Using EmailJS via their REST endpoint as a fallback - user must add public key
    const payload = {
      service_id: 'YOUR_SERVICE_ID',
      template_id: 'YOUR_TEMPLATE_ID',
      user_id: 'YOUR_PUBLIC_KEY',
      template_params: {}
    };
    formData.forEach((v,k)=> payload.template_params[k] = v);

    fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(payload)
    }).then(res=>{
      if (res.ok) {
        alert('Message sent! We will contact you soon.');
        form.reset();
      } else {
        return res.text().then(t=> Promise.reject(t));
      }
    }).catch(err=>{
      console.error('email error', err);
      alert('Could not send message right now. Please try again later.');
    }).finally(()=>{
      if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = oldText; }
    });
  });
})();

/* ---------- optional: small performance guard to stop heavy work on low-power devices ---------- */
(function(){
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  if (isMobile) {
    // Could reduce star count or turn off some visuals; for now, nothing further
  }
})();
