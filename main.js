const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const root = document.documentElement;
let W = innerWidth, H = innerHeight;

/* ---------- Cinematic opening (once per visit; any input skips it) ---------- */
let intro = false;
try {
  if (!reduce && !sessionStorage.getItem('seen-intro')) {
    intro = true;
    root.classList.add('intro');
    sessionStorage.setItem('seen-intro', '1');
    const end = () => root.classList.remove('intro');
    setTimeout(end, 2400);
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(ev => addEventListener(ev, end, { once: true, passive: true }));
  }
} catch {}

/* ---------- Sparkles (owl, hat, rocket, patronus) ---------- */
const cv = $('#sparkles'), ctx = cv.getContext('2d');
const parts = [];
let sparkling = false;
const GOLD = ['#fff6d5', '#f1d79a', '#dff4ff', '#bfe6ff'], SILVER = ['#ffffff', '#e6f6ff', '#bfe6ff', '#9fd8ff'];
function resizeCanvas() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  cv.width = W * dpr; cv.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resizeCanvas();
function spawn(x, y, vx, vy, life, size, colors = GOLD) {
  if (reduce || parts.length > 240) return;
  parts.push({ x, y, vx, vy, life, max: life, size, c: colors[(Math.random() * colors.length) | 0] });
  if (!sparkling) { sparkling = true; requestAnimationFrame(tick); }
}
function burst(x, y, n, colors) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = 0.6 + Math.random() * 2.6;
    spawn(x, y, Math.cos(a) * s, Math.sin(a) * s - 0.6, 40 + Math.random() * 40, 0.8 + Math.random() * 1.8, colors);
  }
}
function tick() {
  ctx.clearRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.015; p.vx *= 0.98; p.life--;
    if (p.life <= 0) { parts.splice(i, 1); continue; }
    const a = p.life / p.max, s = p.size * (0.5 + a);
    ctx.globalAlpha = a * 0.9;
    ctx.fillStyle = p.c;
    ctx.beginPath(); ctx.arc(p.x, p.y, s, 0, 7); ctx.fill();
    if (p.size > 1.9) { ctx.fillRect(p.x - s * 3, p.y - 0.35, s * 6, 0.7); ctx.fillRect(p.x - 0.35, p.y - s * 3, 0.7, s * 6); }
  }
  ctx.globalAlpha = 1;
  if (parts.length) requestAnimationFrame(tick); else sparkling = false;
}

/* ---------- Scroll direction, nav highlight, walker room label ---------- */
let lastY = scrollY;
root.dataset.dir = 'down';
const navFor = id => ({ 'what-i-do': 'great-hall', 'sorting-hat': 'room-of-requirement' }[id] || id);
const roomEl = $('.walker .room');
const sectionObs = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) {
    $$('.plainnav a').forEach(a => a.toggleAttribute('aria-current', a.hash === '#' + navFor(e.target.id)));
    roomEl.textContent = e.target.dataset.room;
  }
}, { rootMargin: '-45% 0px -50% 0px' });
$$('main > section').forEach(s => sectionObs.observe(s));

// only sections near the screen run their little animations
const onscreenObs = new IntersectionObserver(entries => {
  for (const e of entries) e.target.classList.toggle('onscreen', e.isIntersecting);
}, { rootMargin: '120px 0px' });
$$('main > section').forEach(s => onscreenObs.observe(s));

/* ---------- Mobile menu ---------- */
const menuBtn = $('.menu-btn'), nav = $('#nav');
menuBtn.addEventListener('click', () => menuBtn.setAttribute('aria-expanded', nav.classList.toggle('open')));
nav.addEventListener('click', e => {
  if (e.target.closest('a')) { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', false); }
});

/* ---------- Two-way reveals: animate in from whichever edge they enter; re-arm once fully off-screen ---------- */
const revealObs = new IntersectionObserver(entries => {
  for (const e of entries) {
    e.target.classList.toggle('in', e.isIntersecting);
    if (e.isIntersecting && e.target.classList.contains('ledger') && ledgerSrc === 'contest') replayChart();
  }
});
$$('.rv').forEach(el => reduce ? el.classList.add('in') : revealObs.observe(el));
const about = $('.about.scroll'), envelope = $('.envelope');
new ResizeObserver(() => about.style.setProperty('--scroll-h', $('.scroll-body', about).offsetHeight + 'px')).observe(about);
// only once it's in the upper part of the screen does the seal break
const envObs = new IntersectionObserver(([e]) => envelope.classList.toggle('open', e.isIntersecting), { rootMargin: '0px 0px -62% 0px' });
reduce ? envelope.classList.add('open') : envObs.observe(envelope);

/* ---------- Project cards: Daily Prophet affordances, stack as code ---------- */
$$('.artefact').forEach(a => a.insertAdjacentHTML('beforeend', '<span class="np-peek" aria-hidden="true"></span>'));
const longDate = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
$$('[data-dossier]').forEach(b => b.addEventListener('click', () => {
  $$('[data-npdate]').forEach(el => (el.textContent = longDate.format(new Date())));
  modal($('#' + b.dataset.dossier));
}));
// a modal dialog sits in the top layer, above everything in <body>; move the wand and sparkles inside it while it's open
function modal(d) { d.showModal(); if (fine) d.append(cv, $('.wand')); }
$$('dialog').forEach(d => d.addEventListener('close', () => document.body.append(cv, $('.wand'))));
$$('dialog.prophet').forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); }));
const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
$$('.artefact .tech').forEach(p => {
  const items = p.textContent.split('·').map(t => t.trim()).filter(Boolean);
  const code = document.createElement('code');
  code.className = 'stack';
  code.innerHTML = '<span class="k">stack</span><span class="p"> = [</span>' +
    items.map(t => `<span class="s">"${esc(t)}"</span>`).join('<span class="p">, </span>') + '<span class="p">]</span>';
  p.replaceWith(code);
});
const nudgeObs = new IntersectionObserver(([e]) => {
  if (!e.isIntersecting || reduce) return;
  const peek = $('.artefact .np-peek');
  peek.classList.add('nudge');
  setTimeout(() => peek.classList.remove('nudge'), 1400);
  nudgeObs.disconnect();
}, { threshold: 0.4 });
nudgeObs.observe($('.artefacts'));

/* ---------- Launch Cadence: the golden rocket lifts off when the wand touches it ---------- */
const pad = $('.rocket-pad'), rocket = $('.rocket', pad);
let launching = false;
function launch() {
  if (launching || reduce) return;
  launching = true;
  rocket.classList.add('launch');
  const t0 = performance.now();
  const trail = now => {
    const r = rocket.getBoundingClientRect();
    for (let i = 0; i < 2; i++)
      spawn(r.left + r.width / 2 + (Math.random() - 0.5) * 6, r.bottom - 6, (Math.random() - 0.5) * 0.8, 1 + Math.random() * 1.4, 30 + Math.random() * 25, 0.6 + Math.random() * 1.4);
    if (now - t0 < 1150) requestAnimationFrame(trail);
  };
  requestAnimationFrame(trail);
  setTimeout(() => rocket.classList.replace('launch', 'return'), 1900);
  setTimeout(() => { rocket.classList.remove('return'); launching = false; }, 2900);
}
pad.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') launch(); });
pad.addEventListener('click', launch);

/* ---------- Background world: faint per-section drawings + a corridor, scrolling with the page ---------- */
const worldClip = $('.world-clip'), world = $('.world'), lamp = $('.lamp'), lampWorld = $('.lamp-world');
const hero = $('.hero'), heroLamp = $('.hero-lamp'), heroLampIn = $('.hero-lamp-in');
const PAR = 0.92; // the world drifts slightly slower than the page
const rider = document.createElement('div');
rider.className = 'rider';
rider.setAttribute('aria-hidden', 'true');
rider.append($('#rider-tpl').content.cloneNode(true));
worldClip.append(rider);
let track = [], rx = null, ry = 0, rFace = 1, riding = false, rLast = 0;
// target: the point on the line level with the middle of the screen
function ride() {
  if (reduce || track.length < 2 || riding) return;
  riding = true; rLast = 0;
  requestAnimationFrame(rideStep);
}
function rideStep(now) {
  const dt = rLast ? Math.min(0.05, (now - rLast) / 1000) : 0.016;
  rLast = now;
  const want = PAR * scrollY + 0.55 * H;
  let lo = 0, hi = track.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; track[m][1] < want ? (lo = m) : (hi = m); }
  const [tx, ty] = track[hi];
  if (rx === null) { rx = tx; ry = ty; rider.classList.add('on'); }
  const k = 1 - Math.exp(-dt * 8), ox = rx, oy = ry;
  rx += (tx - rx) * k; ry += (ty - ry) * k;
  const mx = rx - ox, my = ry - oy;
  if (Math.abs(mx) > 0.3) rFace += (Math.sign(mx) - rFace) * 0.12;
  const tilt = Math.abs(mx) + Math.abs(my) > 0.2 ? clamp(Math.atan2(my, Math.abs(mx)) * 57.3, -38, 38) : 0;
  rider.style.transform = `translate3d(${rx - 45}px, ${ry - 52 + (1 - PAR) * scrollY}px, 0) rotate(${tilt * Math.sign(rFace)}deg) scaleX(${rFace})`;
  if (Math.hypot(tx - rx, ty - ry) > 0.5 || Math.abs(Math.abs(rFace) - 1) > 0.01) requestAnimationFrame(rideStep);
  else riding = false;
}
const artFor = { 'what-i-do': 'what-i-do', 'room-of-requirement': 'room-of-requirement', 'sorting-hat': 'sorting-hat', journey: 'journey',
  spellbook: 'spellbook', records: 'records', 'trophy-room': 'trophies', 'owl-post': 'owl-post' };
function buildWorld() {
  worldClip.style.height = world.style.height = lampWorld.style.height = '0px';
  const docH = root.scrollHeight, w = Math.min(1500, W), ph = w * 1000 / 1200;
  const pts = [];
  let html = '';
  for (const sec of $$('main > section')) {
    const top = sec.offsetTop, h = sec.offsetHeight;
    // pre-shift so each drawing lines up with its section when the section is centred on screen
    const shift = (1 - PAR) * Math.max(0, top + h / 2 - H / 2);
    const id = artFor[sec.id];
    if (id) for (let y = 0, k = 0; y < h; y += ph, k++)
      html += `<svg viewBox="0 0 1200 1000" style="top:${(top + y - shift).toFixed(0)}px;width:${w}px;height:${ph.toFixed(0)}px"><use href="#art-${id}"/></svg>`;
    pts.push([(pts.length % 2 ? 0.95 : 0.05) * W, top - shift + 40]);
  }
  let d = '';
  pts.forEach(([x, y], i) => {
    if (!i) { d = `M${x} ${y}`; return; }
    const [px, py] = pts[i - 1], m = (py + y) / 2;
    d += `C${px} ${m} ${x} ${m} ${x} ${y}`;
  });
  html += `<svg class="corridor-line" viewBox="0 0 ${W} ${docH}" preserveAspectRatio="none" style="top:0;height:${docH}px"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="6 9"/>` +
    pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="none" stroke="currentColor"/>`).join('') + '</svg>';
  world.innerHTML = lampWorld.innerHTML = html;
  // sample the guide line so the broom rider can follow it (the path only ever runs downwards)
  const line = $('.corridor-line path', world), len = line.getTotalLength();
  track = [];
  for (let l = 0; l <= len; l += 6) { const q = line.getPointAtLength(l); track.push([q.x, q.y]); }
  ride();
  worldClip.style.height = world.style.height = lampWorld.style.height = docH + 'px';
  heroLampIn.style.width = hero.offsetWidth + 'px';
  heroLampIn.style.height = hero.offsetHeight + 'px';
  placeTicks();
}
let rebuildT;
const scheduleBuild = () => { clearTimeout(rebuildT); rebuildT = setTimeout(buildWorld, 180); };
new ResizeObserver(scheduleBuild).observe($('main'));
addEventListener('load', buildWorld);

/* ---------- The wand (desktop) or a slow drifting light (touch): moves the lamps by transform only ---------- */
const wand = $('.wand'), hat = $('.hat'), hatSec = $('#sorting-hat');
let px = -999, py = -999, tilt = 0, lastPX = 0, queued = false;
function placeLamps() {
  lamp.style.transform = `translate3d(${px - 230}px, ${py - 230}px, 0)`;
  lampWorld.style.transform = `translate3d(${230 - px}px, ${230 - py - PAR * scrollY}px, 0)`;
  if (scrollY < hero.offsetHeight) {
    heroLamp.style.transform = `translate3d(${px - 260}px, ${py + scrollY - 260}px, 0)`;
    heroLampIn.style.transform = `translate3d(${260 - px}px, ${260 - py - scrollY}px, 0)`;
  }
}
function frame() {
  queued = false;
  if (fine) {
    tilt += (clamp((px - lastPX) * 0.6, -10, 10) - tilt) * 0.2;
    lastPX = px;
    wand.style.transform = `translate3d(${px - 13}px, ${py - 2.2}px, 0) rotate(${-32 + tilt}deg)`; // tip sits on the pointer
    if (hatSec.classList.contains('onscreen') && !hat.classList.contains('thinking')) {
      const r = hat.getBoundingClientRect(), dx = px - (r.left + r.width / 2), dy = py - (r.top + r.height / 2);
      hat.style.transform = Math.hypot(dx, dy) < 420 ? `rotate(${clamp(dx / 40, -8, 8)}deg)` : '';
    }
    if (Math.abs(tilt) > 0.3) queue();
  }
  placeLamps();
}
const queue = () => { if (!queued) { queued = true; requestAnimationFrame(frame); } };
if (fine) {
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    root.classList.add('wand-on');
    px = e.clientX; py = e.clientY;
    queue();
  }, { passive: true });
  document.addEventListener('pointerleave', () => { px = py = -999; queue(); });
  document.addEventListener('pointerover', e => wand.classList.toggle('hot', !!e.target.closest('a, button')));
} else if (!reduce) {
  root.classList.add('drift-on');
  let last = 0;
  const drift = now => {
    if (!document.hidden && now - last > 33) {
      last = now;
      const t = now / 1000;
      px = W * (0.5 + 0.38 * Math.sin(t * 0.23));
      py = H * (0.55 + 0.25 * Math.sin(t * 0.31 + 1));
      placeLamps();
    }
    requestAnimationFrame(drift);
  };
  requestAnimationFrame(drift);
}

/* ---------- Owl: on each heading a small light gathers, and as it fades the owl is there ---------- */
const tpl = $('#owl-tpl');
const owl = document.createElement('span');
owl.className = 'owl-slot';
owl.append(tpl.content.cloneNode(true));
const flyer = document.createElement('div');
flyer.className = 'flyer';
flyer.append(tpl.content.cloneNode(true));
document.body.append(flyer);
const perches = new Map();
$$('main > section').forEach(sec => {
  let spot = $('.window-spot', sec);
  if (!spot) {
    const h = $('h1, .sec-head h2, .hat-text h2, .eyebrow', sec);
    if (!h) return;
    spot = document.createElement('span');
    spot.className = 'perch-spot';
    spot.setAttribute('aria-hidden', 'true');
    h.append(spot);
  }
  perches.set(sec, spot);
});
perches.get(hero).append(owl);

let target = owl.parentElement, errand = false, hop = 0;
const center = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width }; };
const showFlyer = (x, y, s, rot = 0) => { flyer.style.transform = `translate3d(${x - 30}px, ${y - 30}px, 0) scale(${s / 60}) rotate(${rot}deg)`; };
const glow = document.createElement('span');
glow.className = 'perch-glow';
function appearAt(spot) {
  const my = ++hop;
  spot.append(glow);
  if (reduce) { spot.append(owl); return; }
  owl.classList.add('away');
  glow.getAnimations().forEach(a => a.cancel());
  glow.animate([{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'scale(1.1)', offset: 0.45 }, { opacity: 0, transform: 'scale(1.5)' }], { duration: 950, easing: 'ease-out' });
  setTimeout(() => {
    if (my !== hop) return;
    spot.append(owl);
    owl.classList.remove('away');
    owl.animate([{ opacity: 0, transform: 'scale(.6) translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.2,.8,.3,1.25)' });
    const c = center(owl);
    for (let i = 0; i < 10; i++) spawn(c.x + (Math.random() - 0.5) * c.w, c.y + (Math.random() - 0.5) * c.w, (Math.random() - 0.5) * 0.6, -Math.random() * 0.6, 35, 0.6 + Math.random());
  }, 400);
}
function setTarget(spot) {
  if (!spot || spot === target) return;
  target = spot;
  if (!errand) appearAt(spot);
}
const perchObs = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) setTarget(perches.get(e.target));
}, { rootMargin: '-30% 0px -45% 0px' });
perches.forEach((_, sec) => perchObs.observe(sec));

// eased bezier flight (transform + scale only) for the "Send an owl" errand
const ease = t => 0.5 - Math.cos(Math.PI * t) / 2;
function leg([p0, p1, p2, p3], s0, s1, dur, sparkle) {
  return new Promise(done => {
    const t0 = performance.now();
    let lx = p0.x;
    const step = now => {
      const t = Math.min(1, (now - t0) / dur), e = ease(t), u = 1 - e;
      const x = u * u * u * p0.x + 3 * u * u * e * p1.x + 3 * u * e * e * p2.x + e * e * e * p3.x;
      const y = u * u * u * p0.y + 3 * u * u * e * p1.y + 3 * u * e * e * p2.y + e * e * e * p3.y;
      showFlyer(x, y, s0 + (s1 - s0) * e, clamp((x - lx) * 1.2, -18, 18));
      lx = x;
      if (Math.random() < sparkle) spawn(x, y + 10, (Math.random() - 0.5) * 0.5, Math.random() * 0.4, 50, 0.6 + Math.random() * 1.3);
      t < 1 ? requestAnimationFrame(step) : done();
    };
    requestAnimationFrame(step);
  });
}
$('[data-send-owl]').addEventListener('click', async e => {
  if (reduce || errand) return;
  e.preventDefault();
  const href = e.currentTarget.href;
  errand = true;
  const h = center(owl);
  owl.classList.add('away');
  flyer.classList.add('on', 'errand');
  await leg([h, { x: h.x + W * 0.15, y: h.y - H * 0.3 }, { x: W * 0.8, y: H * 0.1 }, { x: W + 120, y: -80 }], h.w, 70, 1300, 1);
  flyer.classList.remove('errand');
  location.href = href;
  await sleep(600);
  // come home: it simply reappears on whichever heading you're at
  errand = false;
  flyer.classList.remove('on');
  appearAt(target);
});

/* ---------- Marauder's-Map walker: footprints cross the top as you scroll (pooled, transform-only) ---------- */
const walker = $('.walker'), prints = $('.prints', walker), tag = $('.tag', walker), corridor = $('.corridor', walker);
const STEP = 16, POOL = 14;
const pool = Array.from({ length: POOL }, () => {
  prints.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 20 40"><use href="#foot"/></svg>');
  return prints.lastChild;
});
let pi = 0, lastPrintX = null, side = 1, idle, tagW = 0, walkDir = 1;
function placeTicks() {
  const max = root.scrollHeight - H;
  corridor.replaceChildren(...$$('main > section:not(.hero)').map(sec => {
    const i = document.createElement('i');
    i.style.left = Math.min(100, (sec.offsetTop / max) * 100) + '%';
    return i;
  }));
  tagW = tag.offsetWidth;
}
function onWalk() {
  const max = root.scrollHeight - H;
  const x = (max > 0 ? scrollY / max : 0) * (walker.clientWidth - 8);
  if (lastPrintX === null) lastPrintX = x;
  const dir = Math.sign(x - lastPrintX);
  if (dir) walkDir = dir;
  // the name tag leads from the side it's walking towards
  tag.style.transform = `translateX(${walkDir > 0 ? x + 14 : x - tagW - 14}px)`;
  while (Math.abs(x - lastPrintX) >= STEP) {
    lastPrintX += dir * STEP;
    side = -side;
    const f = pool[pi++ % POOL];
    f.style.transform = `translate3d(${lastPrintX}px, ${12 + side * 4}px, 0) rotate(${dir > 0 ? 90 : -90}deg)`;
    f.animate([{ opacity: 0 }, { opacity: 0.95, offset: 0.12 }, { opacity: 0.7, offset: 0.6 }, { opacity: 0 }], { duration: 2800, easing: 'ease-out' });
  }
  walker.classList.add('moving');
  clearTimeout(idle);
  idle = setTimeout(() => walker.classList.remove('moving'), 1200);
}
new MutationObserver(() => { tagW = tag.offsetWidth; }).observe(roomEl, { childList: true });

/* ---------- One scroll handler, batched per frame ---------- */
const topbar = $('.topbar');
let scrollQueued = false;
addEventListener('scroll', () => {
  if (scrollQueued) return;
  scrollQueued = true;
  requestAnimationFrame(() => {
    scrollQueued = false;
    const y = scrollY;
    if (Math.abs(y - lastY) > 4) { root.dataset.dir = y > lastY ? 'down' : 'up'; lastY = y; }
    world.style.transform = `translate3d(0, ${((1 - PAR) * y).toFixed(1)}px, 0)`;
    ride();
    topbar.classList.toggle('scrolled', y > 40);
    onWalk();
    if (px > -999) placeLamps();
  });
}, { passive: true });
addEventListener('resize', () => { W = innerWidth; H = innerHeight; resizeCanvas(); scheduleBuild(); });

/* ---------- Sorting Hat: a little quiz for the visitor, or lines about Saksham ---------- */
const sayEl = $('#hat-say'), quizEl = $('.hat-q'), answersEl = $('.answers', quizEl), bannerEl = $('.banner span');
const live = Object.assign(document.createElement('p'), { className: 'sr-only' });
live.setAttribute('aria-live', 'polite');
hatSec.append(live);
sayEl.setAttribute('aria-live', 'off');
const HOUSE = { gryffindor: 'GRYFFINDOR', ravenclaw: 'RAVENCLAW', hufflepuff: 'HUFFLEPUFF', slytherin: 'SLYTHERIN', all: '…ALL FOUR' };
const TINT = { gryffindor: ['#ff6b5e', '#ffd27f'], ravenclaw: ['#8fb4ff', '#dfe7ff'], hufflepuff: ['#ffd56b', '#fff1c4'], slytherin: ['#6fdc9a', '#dff4e8'], all: GOLD };
const QUIZ = [
  ['Production breaks at 2 a.m. You…', [['Fix it live. Fear is just another bug.', 'gryffindor'], ['Read every log until it makes sense.', 'ravenclaw'],
    ['Wake the team. We fix it together.', 'hufflepuff'], ['Roll back. I had a plan for exactly this.', 'slytherin']]],
  ['Pick a side project:', [['A compiler, obviously.', 'ravenclaw'], ['A game built with friends at 3 a.m.', 'gryffindor'],
    ['A tool my friends actually use every day.', 'hufflepuff'], ['A startup. Seed round by June.', 'slytherin']]],
  ['Tabs or spaces?', [['Spaces. Four. Fight me.', 'gryffindor'], ['Whatever the linter says.', 'hufflepuff'],
    ['Depends on the language spec, actually…', 'ravenclaw'], ['Tabs. Fewer bytes, faster ship.', 'slytherin']]],
];
const VERDICT = {
  gryffindor: 'You’d push to main on a Friday, and it would work.', ravenclaw: 'You read the RFC before the README.',
  hufflepuff: 'Your code reviews are kind and your docs are complete.', slytherin: 'You benchmark everything, and win.',
};
const SAKSHAM = [
  ['A real thirst to know how things work. Recurrent KANs, built from scratch?', 'ravenclaw'],
  ['Plenty of nerve. Took a deepfake-call detector to a hackathon and came back fifth.', 'gryffindor'],
  ['Not afraid of patient, unglamorous work: assisting rescue operations, onboarding 400+ event participants.', 'hufflepuff'],
  ['Ambition, certainly. “If I can imagine it, I want to build it.” Practically a motto.', 'slytherin'],
  ['Curious by nature, builder by instinct. He’d do well in any house. Better hire him.', 'all'],
];
const MUTTER = ['Hmm… curious…', 'Tricky… very tricky…', 'Plenty of talent, I see…', 'Now where to put you…', 'Not a bad mind, not bad at all…'];
const POKE = ['Oi! Mind the brim.', 'I’ve been sorting for a thousand years, you know.', 'Press “Sort me”, if you dare.', 'Careful, I’m a vintage hat.'];
let hatBusy = false, typing = 0, sakshamTurn = 0, tally;
async function speak(text) {
  const my = ++typing;
  live.textContent = text;
  const q = `“${text}”`;
  if (reduce) { sayEl.textContent = q; return; }
  hat.classList.add('speaking');
  for (let i = 1; i <= q.length && my === typing; i++) { sayEl.textContent = q.slice(0, i); await sleep(12); }
  if (my === typing) hat.classList.remove('speaking');
}
const wobble = async ms => { if (reduce) return; hat.classList.add('thinking'); await sleep(ms); hat.classList.remove('thinking'); };
function sortInto(house, line) {
  hatSec.dataset.house = house;
  bannerEl.textContent = HOUSE[house];
  speak(`${HOUSE[house]}! ${line}`);
  const r = hat.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height * 0.3, 60, TINT[house]);
}
function ask(i) {
  const [q, opts] = QUIZ[i];
  $('.q-count', quizEl).textContent = `// question ${i + 1} of ${QUIZ.length}`;
  $('.q', quizEl).textContent = q;
  answersEl.replaceChildren(...opts.map(([label, house]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.addEventListener('click', async () => {
      if (hatBusy) return;
      hatBusy = true;
      tally[house]++;
      speak(MUTTER[(Math.random() * MUTTER.length) | 0]);
      await wobble(500);
      hatBusy = false;
      if (i + 1 < QUIZ.length) ask(i + 1); else finish();
    });
    return b;
  }));
  answersEl.firstChild.focus({ preventScroll: true });
}
async function finish() {
  hatBusy = true;
  quizEl.hidden = true;
  hat.classList.add('thinking');
  for (let i = 0; i < 3 && !reduce; i++) { speak(MUTTER[(Math.random() * MUTTER.length) | 0]); await sleep(520); }
  hat.classList.remove('thinking');
  const best = Math.max(...Object.values(tally));
  const tops = Object.keys(tally).filter(h => tally[h] === best);
  const house = tops[(Math.random() * tops.length) | 0];
  sortInto(house, VERDICT[house]);
  try { localStorage.setItem('house', JSON.stringify(house)); } catch {} // Spell Class picks this up
  $('[data-hat="me"]').textContent = 'Sort me again';
  $('.hat-actions').hidden = false;
  hatBusy = false;
}
$('[data-hat="me"]').addEventListener('click', () => {
  if (hatBusy) return;
  tally = { gryffindor: 0, ravenclaw: 0, hufflepuff: 0, slytherin: 0 };
  delete hatSec.dataset.house;
  $('.hat-actions').hidden = true;
  quizEl.hidden = false;
  speak('Let’s see what’s under all that code…');
  ask(0);
});
$('[data-hat="saksham"]').addEventListener('click', async () => {
  if (hatBusy) return;
  hatBusy = true;
  quizEl.hidden = true;
  delete hatSec.dataset.house;
  speak('Saksham, is it? Hmm…');
  await wobble(1000);
  const [line, house] = SAKSHAM[sakshamTurn++ % SAKSHAM.length];
  sortInto(house, line);
  hatBusy = false;
});
hat.addEventListener('click', () => { if (!hatBusy) { speak(POKE[(Math.random() * POKE.length) | 0]); wobble(600); } });

/* ---------- House Points Ledger: LeetCode / GitHub heatmaps + contest rating, from data/activity.json ---------- */
const fmt = d => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const iso = d => d.toISOString().slice(0, 10);
let ledgerSrc = 'leetcode', activity = null;
function streaks(days, end) {
  let cur = 0, best = 0, run = 0;
  const keys = Object.keys(days).filter(k => days[k] > 0).sort();
  for (let i = 0; i < keys.length; i++) {
    run = i && (new Date(keys[i]) - new Date(keys[i - 1])) / 864e5 === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  const d = new Date(end);
  if (!(days[iso(d)] > 0)) d.setUTCDate(d.getUTCDate() - 1); // today may not be logged yet
  for (; days[iso(d)] > 0; d.setUTCDate(d.getUTCDate() - 1)) cur++;
  return { cur, best };
}
function drawHeatmap(data, src) {
  const set = data[src], sum = $('.ledger-sum');
  const end = new Date(data.updated + 'T00:00:00Z'), start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 7 * 52 - end.getUTCDay());
  const grid = $('.ledger-grid'), months = $('.ledger-months');
  grid.replaceChildren(); months.replaceChildren();
  let total = 0, week = 0;
  for (const d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const n = set.days[iso(d)] || 0;
    total += n;
    const cell = document.createElement('i');
    cell.className = 'l' + (n === 0 ? 0 : n < 3 ? 1 : n < 6 ? 2 : n < 10 ? 3 : 4);
    cell.title = `${n} ${src === 'leetcode' ? 'submission' : 'contribution'}${n === 1 ? '' : 's'} · ${fmt(d)}`;
    grid.append(cell);
    if (d.getUTCDay() === 0 && d.getUTCDate() <= 7) {
      const m = document.createElement('span');
      m.textContent = d.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' });
      m.style.left = week * 16 + 'px';
      months.append(m);
    }
    if (d.getUTCDay() === 6) week++;
  }
  const { cur, best } = streaks(set.days, end);
  if (src === 'leetcode') {
    const s = set.solved || {};
    sum.innerHTML = `<strong>${s.All}</strong> problems solved (${s.Easy} Easy · ${s.Medium} Medium · ${s.Hard} Hard) · <strong>${total}</strong> submissions in the past year · longest streak <strong>${best}</strong> days${cur ? ` · current streak ${cur}` : ''}`;
  } else {
    sum.innerHTML = `<strong>${total}</strong> contributions on GitHub in the past year · longest streak <strong>${best}</strong> days`;
  }
  grid.setAttribute('aria-label', sum.textContent);
  const sc = $('.ledger-scroll');
  sc.scrollLeft = sc.scrollWidth;
}
function drawChart(c) {
  const el = $('.ledger-chart'), hist = c.history, n = hist.length;
  const VW = 760, VH = 230, L = 48, R = 18, T = 18, B = 30;
  const rs = hist.map(h => h.rating);
  const lo = Math.floor((Math.min(...rs) - 20) / 50) * 50, hi = Math.ceil((Math.max(...rs) + 20) / 50) * 50;
  const x = i => L + (n > 1 ? i * (VW - L - R) / (n - 1) : 0), y = r => T + (hi - r) / (hi - lo) * (VH - T - B);
  const peak = Math.max(...rs);
  let grid = '';
  for (let r = lo; r <= hi; r += 50) grid += `<line x1="${L}" x2="${VW - R}" y1="${y(r)}" y2="${y(r)}"/><text x="${L - 8}" y="${y(r) + 4}" text-anchor="end">${r}</text>`;
  const line = hist.map((h, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(h.rating).toFixed(1)}`).join('');
  const dots = hist.map((h, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(h.rating).toFixed(1)}" r="5" tabindex="0" data-i="${i}" class="${h.rating === peak ? 'peak' : ''}" aria-label="${esc(h.title)}, ${h.date}: rating ${h.rating}, rank ${h.rank.toLocaleString('en')}"/>`).join('');
  el.innerHTML = `<svg viewBox="0 0 ${VW} ${VH}" role="img" aria-label="Contest rating over ${n} contests, now ${c.rating}">
    <defs><linearGradient id="lc-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="rgba(236,211,154,.25)"/><stop offset="1" stop-color="rgba(236,211,154,0)"/></linearGradient></defs>
    <g class="grid">${grid}</g><path class="area" d="${line}L${x(n - 1)} ${VH - B}L${x(0)} ${VH - B}Z"/><path class="line" d="${line}"/>${dots}</svg><div class="chart-tip"></div>`;
  const path = $('.line', el), len = path.getTotalLength();
  path.style.setProperty('--len', len);
  const tip = $('.chart-tip', el);
  const show = dot => {
    const h = hist[dot.dataset.i], box = el.getBoundingClientRect(), r = dot.getBoundingClientRect();
    tip.innerHTML = `${esc(h.title)}<br>${h.date} · rating <b>${h.rating}</b> · rank ${h.rank.toLocaleString('en')}`;
    tip.style.left = r.left + r.width / 2 - box.left + 'px';
    tip.style.top = r.top - box.top + 'px';
    tip.classList.add('on');
  };
  $$('circle', el).forEach(dot => {
    ['pointerenter', 'focus'].forEach(ev => dot.addEventListener(ev, () => show(dot)));
    ['pointerleave', 'blur'].forEach(ev => dot.addEventListener(ev, () => tip.classList.remove('on')));
  });
  $('.ledger-sum').innerHTML = `Contest rating <strong>${c.rating}</strong> · top <strong>${c.top}%</strong> globally · <strong>${c.attended}</strong> contests · peak <strong>${peak}</strong> · global rank ${c.globalRank.toLocaleString('en')}`;
  replayChart();
}
function replayChart() {
  const path = $('.ledger-chart .line');
  if (!path || reduce) return;
  const len = path.getTotalLength();
  path.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 1600, easing: 'ease' });
}
function drawLedger(src) {
  ledgerSrc = src;
  const chart = src === 'contest';
  $('.ledger-chart').hidden = !chart;
  $('.ledger-scroll').hidden = $('.ledger-legend').hidden = chart;
  if (!activity?.[src]) { $('.ledger-sum').textContent = 'The ledger is closed today. Try again later.'; return; }
  chart ? drawChart(activity.contest) : drawHeatmap(activity, src);
}
const fmtUpdated = d => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
fetch('data/activity.json').then(r => r.json()).then(data => {
  activity = data;
  if (data.leetcode?.solved?.All) $$('[data-lc-solved]').forEach(el => (el.textContent = data.leetcode.solved.All));
  if (data.leetcode?.solved?.All) $('[data-sb="lc"]').textContent = `LeetCode ${data.leetcode.solved.All} ✓`;
  if (data.contest) $('[data-sb="contest"]').textContent = `contest rating ${data.contest.rating}`;
  $('.ledger-upd').textContent = 'Updated ' + fmtUpdated(data.updated);
  $$('[data-updated]').forEach(el => (el.textContent = ` · ledger updated ${fmtUpdated(data.updated)}`));
  drawLedger('leetcode');
  $$('.ledger-src button').forEach(b => b.addEventListener('click', () => {
    $$('.ledger-src button').forEach(x => x.setAttribute('aria-pressed', x === b));
    drawLedger(b.dataset.src);
  }));
}).catch(() => { $('.ledger-sum').textContent = 'The ledger is closed today. Try again later.'; });

/* ---------- Live GitHub stats + last push (public API; falls back to the static text) ---------- */
const ago = t => {
  const d = Math.round((Date.now() - new Date(t)) / 864e5);
  return d <= 0 ? 'today' : d === 1 ? 'yesterday' : d < 31 ? `${d}d ago` : `${Math.round(d / 30)}mo ago`;
};
fetch('https://api.github.com/users/devSaksham/repos?per_page=100&type=owner&sort=pushed').then(r => r.ok ? r.json() : Promise.reject()).then(repos => {
  const own = repos.filter(r => !r.fork), langs = {};
  own.forEach(r => { if (r.language) langs[r.language] = (langs[r.language] || 0) + 1; });
  const top = Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([l]) => l);
  $('[data-gh-repos]').textContent = `${own.length} repos`;
  if (top.length) $('[data-gh-sub]').textContent = `mostly ${top.join(' · ')} · @devSaksham`;
  const latest = own.sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))[0];
  if (latest) {
    const sb = $('[data-sb="push"]');
    sb.textContent = `last push ${ago(latest.pushed_at)} · ${latest.name}`;
    sb.hidden = false;
  }
}).catch(() => {});

/* ---------- Local time in Dehradun (status bar, Owl Post, footer) ---------- */
function tickClock() {
  const now = new Date();
  const hhmm = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }).format(now);
  const nice = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit' }).format(now).toLowerCase();
  const hr = +hhmm.slice(0, 2);
  const mood = hr >= 5 && hr < 11 ? 'the morning post has just arrived' : hr < 17 ? 'lessons are in session'
    : hr < 20 ? 'the candles are being lit' : 'the candles are lit and the owls are out';
  $('[data-sb="time"]').textContent = `IST ${hhmm}`;
  $$('[data-localtime]').forEach(el => (el.textContent = `It’s ${nice} in Dehradun, and ${mood}.`));
  $$('[data-ist]').forEach(el => (el.textContent = `${longDate.format(now).toLowerCase()}, ${hhmm} ist`));
}
tickClock();
setInterval(tickClock, 30000);

/* ---------- Section labels: a tiny command types itself, then prints one real fact ---------- */
const skillCount = $('[data-skill-count]');
if (skillCount) skillCount.textContent = $$('.chips li').length;
const labelObs = new IntersectionObserver(entries => {
  for (const e of entries) {
    const k = e.target, cmd = $('.cmd', k), text = '$ ' + k.dataset.cmd;
    if (!e.isIntersecting) { k.classList.remove('done'); k.run = 0; continue; } // re-arm for the next visit
    if (k.run) continue;
    const my = k.run = performance.now();
    (async () => {
      for (let i = 2; i <= text.length && k.run === my; i++) { cmd.textContent = text.slice(0, i); await sleep(40); }
      if (k.run === my) k.classList.add('done');
    })();
  }
}, { threshold: 1 });
$$('.kicker[data-cmd]').forEach(k => reduce ? k.classList.add('done') : labelObs.observe(k));

/* ---------- Command palette: / or Ctrl/⌘ K ---------- */
const palette = $('#palette'), palInput = $('input', palette), palList = $('.pal-list', palette);
const go = id => () => document.getElementById(id).scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
const open = url => () => window.open(url, '_blank', 'noopener');
const COMMANDS = [
  ['Go to Projects', 'cd room-of-requirement', go('room-of-requirement')],
  ['Go to Experience', 'cd journey', go('journey')],
  ['Go to Skills', 'cd spellbook', go('spellbook')],
  ['Go to About', 'cd records', go('records')],
  ['Go to Certificates', 'cd trophy-room', go('trophy-room')],
  ['Go to Contact', 'cd owl-post', go('owl-post')],
  ['Back to the Great Hall', 'cd ~', go('great-hall')],
  ['Spell Class', 'learn commands as spells', () => (location.href = 'spell-class.html')],
  ['Accio resume', 'resume on request', go('owl-post')],
  ['Copy email', 'reach.saksham.agrawal@gmail.com', () => copyEmail()],
  ['Sort me', 'sorting hat quiz', () => { go('sorting-hat')(); setTimeout(() => $('[data-hat="me"]').click(), 600); }],
  ['Lumos / Nox', 'toggle the wand light', () => root.classList.toggle('nox')],
  ['Open GitHub', 'github.com/devSaksham', open('https://github.com/devSaksham')],
  ['Open LinkedIn', 'in/sakshamhere', open('https://www.linkedin.com/in/sakshamhere/')],
  ['Open LeetCode', 'Sakshamm_codes', open('https://leetcode.com/u/Sakshamm_codes/')],
  ['Open JobGenie', 'jobgenie.tech · live', open('https://jobgenie.tech/')],
];
let palItems = [], palSel = 0;
function renderPalette() {
  const q = palInput.value.trim().toLowerCase();
  palItems = COMMANDS.filter(([a, b]) => !q || (a + ' ' + b).toLowerCase().includes(q));
  palSel = Math.min(palSel, Math.max(0, palItems.length - 1));
  palList.replaceChildren(...palItems.map(([a, b], i) => {
    const li = document.createElement('li');
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', i === palSel);
    li.innerHTML = `<span>${a}</span><small>${esc(b)}</small>`;
    li.addEventListener('click', () => runCommand(i));
    return li;
  }));
}
function runCommand(i) { const c = palItems[i]; if (!c) return; palette.close(); c[2](); }
function openPalette() { palInput.value = ''; palSel = 0; renderPalette(); modal(palette); palInput.focus(); }
palInput.addEventListener('input', () => { palSel = 0; renderPalette(); });
palInput.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); palSel = (palSel + (e.key === 'ArrowDown' ? 1 : -1) + palItems.length) % palItems.length; renderPalette(); }
  if (e.key === 'Enter') { e.preventDefault(); runCommand(palSel); }
});
palette.addEventListener('click', e => { if (e.target === palette) palette.close(); });
$$('[data-open-palette]').forEach(b => b.addEventListener('click', openPalette));
addEventListener('keydown', e => {
  const typing = /input|textarea/i.test(document.activeElement.tagName);
  if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') || (e.key === '/' && !typing && !palette.open)) { e.preventDefault(); openPalette(); }
});

/* ---------- Footer ---------- */
const footer = $('.foot');
$$('[data-top]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); }));

/* ---------- Patronus: a silver doe leaps from the wand, picks her way across, pauses, then bounds away ---------- */
let patronusArmed = true, lastPatronus = -Infinity;
new IntersectionObserver(([e]) => {
  if (!e.isIntersecting) { patronusArmed = true; return; }
  if (patronusArmed && performance.now() - lastPatronus > 20000) { patronusArmed = false; lastPatronus = performance.now(); patronus(); }
}, { threshold: 0.5 }).observe(footer);
const doeTpl = $('#doe-tpl');
const flash = Object.assign(document.createElement('div'), { className: 'cast-flash' });
const beam = Object.assign(document.createElement('div'), { className: 'patronus-beam' });
document.body.append(flash, beam);
const lightPool = Object.assign(document.createElement('div'), { className: 'patronus-pool' });
document.body.append(lightPool);
// leg poses in degrees [upper, lower]; positive swings back. Keys: front/rear, near/far
const LEAP = { // takeoff, mid-air, landing
  fn: [[25, 80], [-62, 12], [-24, 0]], ff: [[35, 90], [-52, 22], [-14, 6]],
  rn: [[45, -6], [58, 26], [-32, 40]], rf: [[36, 0], [62, 32], [-22, 44]],
};
const smooth = t => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const key3 = ([a, b, c], t) => t < 0.5 ? lerp(a, b, smooth(t * 2)) : lerp(b, c, smooth(t * 2 - 1));
function patronus() {
  if (reduce) return;
  const wandOn = root.classList.contains('wand-on') && px > 0;
  const src = wandOn ? { x: px, y: py } : center($('.foot-castle', footer));
  // the room brightens for a moment, like a real cast
  flash.animate([{ opacity: 0 }, { opacity: 0.22, offset: 0.18 }, { opacity: 0 }], { duration: 1800, easing: 'ease-out' });
  burst(src.x, src.y, 40, SILVER);
  const el = document.createElement('div');
  el.className = 'patronus';
  el.append(doeTpl.content.cloneNode(true));
  document.body.append(el);
  const rig = {};
  for (const k of ['fn', 'ff', 'rn', 'rf']) { const u = $('.u.' + k, el); rig[k] = [u, $('.l', u)]; }
  const head = $('.head', el);
  const pose = (k, a, b) => { rig[k][0].setAttribute('transform', `rotate(${a})`); rig[k][1].setAttribute('transform', `rotate(${b})`); };

  // she travels away from the wand's side: lands near one edge, ends at the other
  const dir = src.x < W / 2 ? 1 : -1, ground = Math.min(H * 0.8, H - 60);
  const x0 = dir > 0 ? clamp(src.x - 60, 110, W * 0.16) : clamp(src.x + 60, W * 0.84, W - 110);
  const walkTo = x0 + dir * Math.min(170, W * 0.22), xEnd = dir > 0 ? W - 40 : 40;
  const T = { emerge: 900, land: 300, walk: 2100, look: 900, gather: 300, leap: 820 };
  const t1 = T.emerge, t2 = t1 + T.land, t3 = t2 + T.walk, t4 = t3 + T.look, t5 = t4 + T.gather, END = t5 + T.leap * 3;
  const hops = [0, 1, 2].map(i => ({ a: lerp(walkTo, xEnd, i / 3), b: lerp(walkTo, xEnd, (i + 1) / 3), h: [70, 96, 150][i], rise: i === 2 ? 150 : 0 }));
  const t0 = performance.now();
  const step = now => {
    const t = clamp(now - t0, 0, END);
    let x, y = ground, pitch = 0, sc = 1, op = 0.95, headA = 0, air = 0;
    if (t < t1) { // leaps out of the wand light and lands
      const p = t / t1, e = smooth(p);
      x = lerp(src.x, x0, e); y = lerp(src.y, ground, e) - 140 * 4 * p * (1 - p);
      sc = 0.45 + 0.55 * e; op = Math.min(0.95, p * 2.2); air = 1 - p;
      pitch = lerp(-12, 8, p);
      for (const k in LEAP) pose(k, key3(LEAP[k].map(v => v[0]), p), key3(LEAP[k].map(v => v[1]), p));
      const bo = 1 - p, sx = wandOn ? px : src.x, sy = wandOn ? py : src.y, dist = Math.hypot(x - sx, y - 80 - sy);
      beam.style.opacity = bo * 0.85;
      beam.style.transform = `translate3d(${sx}px, ${sy - 6}px, 0) rotate(${Math.atan2(y - 80 - sy, x - sx)}rad) scaleX(${dist / 100})`;
    } else if (t < t2) { // lands softly
      beam.style.opacity = 0;
      const p = (t - t1) / T.land;
      x = x0; y = ground + Math.sin(p * Math.PI) * 4;
      for (const k in LEAP) pose(k, lerp(LEAP[k][2][0], 0, p), lerp(LEAP[k][2][1], 0, p));
    } else if (t < t3) { // picks her way across, head held high
      const p = (t - t2) / T.walk, ph = (t - t2) / 900;
      x = lerp(x0, walkTo, p); y = ground - Math.abs(Math.sin(ph * Math.PI * 2)) * 2;
      const off = { rn: 0, fn: 0.25, rf: 0.5, ff: 0.75 };
      for (const k in off) { const s = Math.sin((ph + off[k]) * Math.PI * 2); pose(k, -18 * s, 34 * Math.max(0, Math.cos((ph + off[k]) * Math.PI * 2))); }
      headA = -3 + Math.sin(ph * Math.PI * 4) * 1.5;
    } else if (t < t4) { // stops, lifts a foreleg and looks back at you
      const p = (t - t3) / T.look, s = Math.sin(Math.min(1, p * 1.6) * Math.PI / 2);
      x = walkTo;
      pose('fn', -22 * s, 88 * s); pose('ff', 0, 0); pose('rn', 0, 0); pose('rf', 0, 0);
      headA = -9 * s;
    } else if (t < t5) { // gathers
      const p = (t - t4) / T.gather;
      x = walkTo; y = ground + 6 * p; pitch = 4 * p; headA = lerp(-9, 0, p);
      for (const k in LEAP) pose(k, lerp(k === 'fn' ? -22 : 0, LEAP[k][0][0], p), lerp(k === 'fn' ? 88 : 0, LEAP[k][0][1], p));
    } else { // three long, unhurried bounds; the last carries her up and away
      const i = Math.min(2, Math.floor((t - t5) / T.leap)), p = clamp((t - t5 - i * T.leap) / T.leap, 0, 1), hp = hops[i];
      x = lerp(hp.a, hp.b, p); y = ground - hp.h * 4 * p * (1 - p) - hp.rise * smooth(p);
      pitch = lerp(-10, i === 2 ? -6 : 9, p); air = 4 * p * (1 - p);
      for (const k in LEAP) pose(k, key3(LEAP[k].map(v => v[0]), p), key3(LEAP[k].map(v => v[1]), p));
      if (i === 2) { op = 0.95 * (1 - smooth(clamp((p - 0.35) / 0.65, 0, 1))); sc = 1 + 0.12 * p; }
    }
    head.setAttribute('transform', `rotate(${headA} 146 76)`);
    el.style.opacity = op;
    el.style.transform = `translate3d(${x - 110}px, ${y - 167}px, 0) rotate(${pitch * dir}deg) scale(${sc * dir}, ${sc})`;
    // light pooled on the ground beneath her
    lightPool.style.opacity = op * (1 - Math.min(1, (ground - y) / 160)) * 0.9;
    lightPool.style.transform = `translate3d(${x - 120}px, ${ground - 18}px, 0)`;
    // wisps swirl around her and trail behind
    if (op > 0.05) {
      const a = now / 260 + Math.random();
      spawn(x + Math.cos(a) * 70, y - 80 + Math.sin(a) * 36, -Math.sin(a) * 0.7 - dir * 0.3, Math.cos(a) * 0.4 - 0.15, 45 + Math.random() * 30, 0.6 + Math.random() * 1.2, SILVER);
      if (air > 0.2 || Math.random() < 0.3) spawn(x - dir * 80 + (Math.random() - 0.5) * 30, y - 60 + (Math.random() - 0.5) * 40, -dir * Math.random() * 0.6, 0.1 + Math.random() * 0.3, 55 + Math.random() * 30, 0.6 + Math.random() * 1.4, SILVER);
    }
    if (t >= END) {
      burst(x, y - 90, 60, SILVER);
      el.remove(); lightPool.style.opacity = 0; beam.style.opacity = 0;
      return;
    }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---------- Portrait: a brick wall that opens diagonally under the wand ---------- */
const frameEl = $('.portrait .frame'), bricksEl = $('.bricks', frameEl);
if (reduce) frameEl.classList.add('open');
else {
  const ROWS = 9, COLS = 4, MAXD = ROWS + COLS;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c <= COLS; c++) {
    const half = r % 2;
    if (!half && c === COLS) continue;
    // distance from the top-left/bottom-right seam decides who moves first, and which way
    const off = c / COLS - r / ROWS, side = off >= 0 ? 1 : -1, d = Math.round(Math.abs(off) * MAXD);
    const b = document.createElement('i');
    b.style.cssText = `left:${(c - half * 0.5) * 100 / COLS}%;top:${r * 100 / ROWS}%;--s:${side};--d:${d};--dr:${MAXD - d}`;
    b.innerHTML = `<b style="left:${-(c - half * 0.5) * 100}%;top:${-r * 100}%">SA</b>`;
    bricksEl.append(b);
  }
  const openWall = on => frameEl.classList.toggle('open', on);
  frameEl.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') openWall(true); });
  frameEl.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') openWall(false); });
  frameEl.addEventListener('click', () => openWall(!frameEl.classList.contains('open')));
  if (!fine) {
    $('.brick-hint').textContent = 'Tap the wall';
    const first = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setTimeout(() => openWall(true), 500); first.disconnect(); } }, { threshold: 0.7 });
    first.observe(frameEl);
  }
}

/* ---------- A note for whoever opens the console ---------- */
console.log(`%c
   ,_,
  (O,O)   Hello, fellow developer.
  (   )   This site is hand-written HTML, CSS and JS, no framework. Try pressing "/".
  -"-"-   Hiring, or want to build something? reach.saksham.agrawal@gmail.com
`, 'font-family: monospace; color: #c9a45c; font-size: 12px;');

/* ---------- Copy email ---------- */
const copied = $('.copied');
async function copyEmail() {
  const text = 'reach.saksham.agrawal@gmail.com';
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const t = Object.assign(document.createElement('textarea'), { value: text });
    document.body.append(t); t.select(); document.execCommand('copy'); t.remove();
  }
  copied.textContent = 'Copied. The owl knows the way.';
  setTimeout(() => (copied.textContent = ''), 2600);
}
$('[data-copy]').addEventListener('click', copyEmail);

buildWorld();
onWalk();
