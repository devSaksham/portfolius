const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const root = document.documentElement;

/* ---------- Current section highlights the nav ---------- */
const navFor = id => ({ 'what-i-do': 'great-hall', 'sorting-hat': 'room-of-requirement' }[id] || id);
const sectionObs = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting)
    $$('.plainnav a').forEach(a => a.toggleAttribute('aria-current', a.hash === '#' + navFor(e.target.id)));
}, { rootMargin: '-45% 0px -50% 0px' });
$$('main > section').forEach(s => sectionObs.observe(s));

/* ---------- Mobile menu ---------- */
const menuBtn = $('.menu-btn'), nav = $('#nav');
menuBtn.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', open);
});
nav.addEventListener('click', e => {
  if (e.target.closest('a')) { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', false); }
});

/* ---------- Gentle fade-ins + footsteps leading into each section ---------- */
$$('main > section:not(.hero)').forEach(sec => {
  const walk = document.createElement('div');
  walk.className = 'walk';
  walk.setAttribute('aria-hidden', 'true');
  const n = 6;
  for (let i = 0; i < n; i++) {
    walk.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 20 40"><use href="#foot"/></svg>');
    const f = walk.lastChild;
    const side = i % 2 ? 9 : -9;
    f.style.top = (i / (n - 1)) * 100 + '%';
    f.style.left = Math.sin(i * 0.9) * 14 + side + 'px';
    f.style.setProperty('--r', 180 + Math.cos(i * 0.9) * 14 + 'deg'); // toes pointing down the page
    f.style.transitionDelay = i * 0.22 + 's';
  }
  sec.prepend(walk);
});

const revealObs = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); revealObs.unobserve(e.target); }
}, { rootMargin: '0px 0px -12% 0px' });
$$('.rv, .walk').forEach(el => reduce ? el.classList.add('in') : revealObs.observe(el));

/* ---------- Project dossiers ---------- */
$$('[data-dossier]').forEach(b => b.addEventListener('click', () => $('#' + b.dataset.dossier).showModal()));
$$('dialog.prophet').forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); }));

/* ---------- Spellbook tabs ---------- */
const tabs = $$('.chapters [role="tab"]');
function selectTab(tab, focus) {
  tabs.forEach(t => {
    const on = t === tab;
    t.setAttribute('aria-selected', on);
    t.tabIndex = on ? 0 : -1;
    const panel = $('#' + t.getAttribute('aria-controls'));
    panel.hidden = !on;
    if (on && !reduce) { panel.classList.remove('turn'); void panel.offsetWidth; panel.classList.add('turn'); }
  });
  if (focus) tab.focus();
}
tabs.forEach((t, i) => {
  $('#' + t.getAttribute('aria-controls')).hidden = i !== 0;
  t.addEventListener('click', () => selectTab(t));
  t.addEventListener('keydown', e => {
    const k = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (k) { e.preventDefault(); selectTab(tabs[(i + k + tabs.length) % tabs.length], true); }
    if (e.key === 'Home') { e.preventDefault(); selectTab(tabs[0], true); }
    if (e.key === 'End') { e.preventDefault(); selectTab(tabs.at(-1), true); }
  });
});

/* ---------- Sparkles (owl trail, hat verdict) ---------- */
const cv = $('#sparkles'), ctx = cv.getContext('2d');
const parts = [];
let W = innerWidth, H = innerHeight, running = false;
const COLORS = ['#fff6d5', '#f1d79a', '#dff4ff', '#bfe6ff'];
function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  cv.width = W * dpr; cv.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resize();
addEventListener('resize', resize);
function spawn(x, y, vx, vy, life, size) {
  if (reduce || parts.length > 220) return;
  parts.push({ x, y, vx, vy, life, max: life, size, c: COLORS[(Math.random() * COLORS.length) | 0] });
  if (!running) { running = true; requestAnimationFrame(tick); }
}
function burst(x, y, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = 0.6 + Math.random() * 2.6;
    spawn(x, y, Math.cos(a) * s, Math.sin(a) * s - 0.6, 40 + Math.random() * 40, 0.8 + Math.random() * 1.8);
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
  if (parts.length) requestAnimationFrame(tick); else running = false;
}

/* ---------- Sorting Hat ---------- */
const hat = $('.hat'), hatSec = $('#sorting-hat'), say = $('#hat-say');
const verdicts = [
  ['Hmm… difficult. Very difficult. A real thirst to know how things work — recurrent KANs, built from scratch?', 'ravenclaw', 'RAVENCLAW!'],
  ['Plenty of nerve, I see. Took a deepfake-call detector to a hackathon and came back fifth.', 'gryffindor', 'GRYFFINDOR!'],
  ['Not afraid of the patient, unglamorous work — assisting rescue operations, onboarding 400+ event participants.', 'hufflepuff', 'HUFFLEPUFF!'],
  ['Ambition, certainly. “If I can imagine it, I want to build it” — that’s practically a motto.', 'slytherin', 'SLYTHERIN!'],
  ['Curious by nature. Builder by instinct. I give up — this one would do well in any house. Better hire them.', 'all', '…ALL FOUR!'],
];
let turn = 0, busy = false;
hat.addEventListener('click', async () => {
  if (busy) return;
  busy = true;
  const [line, house, verdict] = verdicts[turn++ % verdicts.length];
  delete hatSec.dataset.house;
  say.textContent = '“Hmm…”';
  hat.classList.add('thinking');
  if (!reduce) await sleep(1100);
  hat.classList.replace('thinking', 'speaking');
  const q = `“${line}”`;
  if (reduce) say.textContent = q;
  else for (let i = 1; i <= q.length; i++) { say.textContent = q.slice(0, i); await sleep(18); }
  hat.classList.remove('speaking');
  hatSec.dataset.house = house;
  const v = document.createElement('span');
  v.className = 'verdict';
  v.textContent = verdict;
  say.append(v);
  const r = hat.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height * 0.3, 36);
  busy = false;
});

/* ---------- Wand: a torch that lights the castle and the star charts ---------- */
const wand = $('.wand'), castleLit = $('.castle-lit');
if (castleLit && !fine) { castleLit.style.setProperty('--hx', '30%'); castleLit.style.setProperty('--hy', '58%'); }
if (fine) {
  let x = -999, y = -999, lastX = 0, tilt = 0, queued = false;
  const frame = () => {
    queued = false;
    tilt += (Math.max(-10, Math.min(10, (x - lastX) * 0.6)) - tilt) * 0.2;
    lastX = x;
    // tip of the wand sits exactly on the pointer
    wand.style.transform = `translate(${x - 13}px, ${y - 2.7}px) rotate(${-32 + tilt}deg)`;
    root.style.setProperty('--mx', x + 'px');
    root.style.setProperty('--my', y + 'px');
    if (castleLit) {
      const r = castleLit.getBoundingClientRect();
      castleLit.style.setProperty('--hx', x - r.left + 'px');
      castleLit.style.setProperty('--hy', y - r.top + 'px');
    }
    if (Math.abs(tilt) > 0.3) queue();
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(frame); } };
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    root.classList.add('wand-on');
    x = e.clientX; y = e.clientY;
    queue();
  }, { passive: true });
  addEventListener('scroll', queue, { passive: true });
  document.addEventListener('pointerleave', () => { x = y = -999; queue(); });
  document.addEventListener('pointerover', e => wand.classList.toggle('hot', !!e.target.closest('a, button')));
}

/* ---------- Owl: perched in the header and the Owl Post, flies on contact ---------- */
const tpl = $('#owl-tpl');
$$('.owl-slot').forEach(s => s.append(tpl.content.cloneNode(true)));
const navOwl = $('.nav-owl'), postOwl = $('.post-owl');
const ease = t => 0.5 - Math.cos(Math.PI * t) / 2;
const center = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width }; };

function leg(flyer, size, [p0, p1, p2, p3], dur, sparkle) {
  return new Promise(done => {
    const t0 = performance.now();
    let px = p0.x;
    const step = now => {
      const t = Math.min(1, (now - t0) / dur), e = ease(t), u = 1 - e;
      const x = u * u * u * p0.x + 3 * u * u * e * p1.x + 3 * u * e * e * p2.x + e * e * e * p3.x;
      const y = u * u * u * p0.y + 3 * u * u * e * p1.y + 3 * u * e * e * p2.y + e * e * e * p3.y;
      const tilt = Math.max(-18, Math.min(18, (x - px) * 1.2));
      px = x;
      flyer.style.transform = `translate(${x - size / 2}px, ${y - size / 2}px) rotate(${tilt}deg)`;
      for (let i = 0; i < sparkle; i++)
        spawn(x + (Math.random() - 0.5) * size * 0.4, y + size * 0.15, (Math.random() - 0.5) * 0.6, Math.random() * 0.5, 40 + Math.random() * 30, 0.6 + Math.random() * 1.4);
      t < 1 ? requestAnimationFrame(step) : done();
    };
    requestAnimationFrame(step);
  });
}

const flying = new Set();
async function flight(slot, out, back, onAway) {
  if (reduce || flying.has(slot)) { onAway?.(); return; }
  flying.add(slot);
  const home = center(slot);
  const size = Math.max(home.w * 1.2, 60);
  const flyer = document.createElement('div');
  flyer.className = 'flyer';
  flyer.style.width = flyer.style.height = size + 'px';
  flyer.append(tpl.content.cloneNode(true));
  document.body.append(flyer);
  slot.classList.add('away');
  await leg(flyer, size, out(home), 1300, 1);
  onAway?.();
  await sleep(500);
  const h2 = center(slot);
  await leg(flyer, size, back(h2), 1600, 2);
  flyer.remove();
  slot.classList.remove('away');
  burst(h2.x, h2.y, 10);
  flying.delete(slot);
}

// Any link to the Owl Post sends the header owl on a loop and back
$$('a[href="#owl-post"]').forEach(a => a.addEventListener('click', () => {
  const vis = getComputedStyle(navOwl).display !== 'none';
  if (vis) flight(navOwl,
    h => [h, { x: h.x - 140, y: h.y + H * 0.35 }, { x: W * 0.45, y: H * 0.8 }, { x: -90, y: H * 0.45 }],
    h => [{ x: W + 90, y: H * 0.3 }, { x: W * 0.7, y: H * 0.65 }, { x: h.x + 60, y: h.y + H * 0.3 }, h]);
}));

// "Send an owl" flies the big owl off with the letter, then opens mail
$('[data-send-owl]').addEventListener('click', e => {
  if (reduce) return;
  e.preventDefault();
  const href = e.currentTarget.href;
  flight(postOwl,
    h => [h, { x: h.x + W * 0.15, y: h.y - H * 0.3 }, { x: W * 0.8, y: H * 0.1 }, { x: W + 120, y: -80 }],
    h => [{ x: -120, y: H * 0.2 }, { x: W * 0.2, y: H * 0.1 }, { x: h.x - 80, y: h.y - H * 0.2 }, h],
    () => { location.href = href; });
});

/* ---------- Copy email ---------- */
const copied = $('.copied');
$('[data-copy]').addEventListener('click', async e => {
  const text = e.currentTarget.dataset.copy;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const t = Object.assign(document.createElement('textarea'), { value: text });
    document.body.append(t); t.select(); document.execCommand('copy'); t.remove();
  }
  copied.textContent = 'Copied — the owl knows the way.';
  setTimeout(() => (copied.textContent = ''), 2600);
});
