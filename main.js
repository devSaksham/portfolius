const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const root = document.documentElement;

/* ---------- Cinematic opening (once per visit; any input skips it) ---------- */
try {
  if (!reduce && !sessionStorage.getItem('seen-intro')) {
    root.classList.add('intro');
    sessionStorage.setItem('seen-intro', '1');
    const end = () => root.classList.remove('intro');
    setTimeout(end, 2400);
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(ev => addEventListener(ev, end, { once: true, passive: true }));
  }
} catch {}

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

/* ---------- Gentle fade-ins ---------- */
const revealObs = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); revealObs.unobserve(e.target); }
}, { rootMargin: '0px 0px -12% 0px' });
$$('.rv').forEach(el => reduce ? el.classList.add('in') : revealObs.observe(el));

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
const artSecs = $$('main > section:not(.hero)');
// point every on-screen layer that the wand lights at the same viewport spot
function light(x, y) {
  root.style.setProperty('--mx', x + 'px');
  root.style.setProperty('--my', y + 'px');
  if (castleLit) {
    const r = castleLit.getBoundingClientRect();
    if (r.bottom > 0) { castleLit.style.setProperty('--hx', x - r.left + 'px'); castleLit.style.setProperty('--hy', y - r.top + 'px'); }
  }
  for (const sec of artSecs) {
    const r = sec.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) continue;
    sec.style.setProperty('--lx', x - r.left + 'px');
    sec.style.setProperty('--ly', y - r.top + 'px');
  }
}
// touch screens: no wand, so a soft light drifts slowly over the castle and the star charts
if (!fine && !reduce) {
  root.classList.add('drift-on');
  let last = 0;
  const drift = now => {
    if (!document.hidden && now - last > 33) {
      last = now;
      const t = now / 1000;
      const mx = innerWidth * (0.5 + 0.38 * Math.sin(t * 0.23)), my = innerHeight * (0.55 + 0.25 * Math.sin(t * 0.31 + 1));
      light(mx, my);
    }
    requestAnimationFrame(drift);
  };
  requestAnimationFrame(drift);
}
if (fine) {
  let x = -999, y = -999, lastX = 0, tilt = 0, queued = false;
  const frame = () => {
    queued = false;
    tilt += (Math.max(-10, Math.min(10, (x - lastX) * 0.6)) - tilt) * 0.2;
    lastX = x;
    // tip of the wand sits exactly on the pointer
    wand.style.transform = `translate(${x - 13}px, ${y - 2.2}px) rotate(${-32 + tilt}deg)`;
    light(x, y);
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

/* ---------- Owl: perches on the heading you're reading, flies between them ---------- */
const tpl = $('#owl-tpl');
const owl = document.createElement('span');
owl.className = 'owl-slot';
owl.append(tpl.content.cloneNode(true));
// a perch at the end of each section title; the Owl Post perch is the window
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
perches.get($('.hero')).append(owl);

const ease = t => 0.5 - Math.cos(Math.PI * t) / 2;
const box = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width }; };

// cubic bezier flight of a fixed-position copy; size eases from start to end
function leg(flyer, [p0, p1, p2, p3], s0, s1, dur, sparkle) {
  return new Promise(done => {
    const t0 = performance.now();
    let px = p0.x;
    const step = now => {
      const t = Math.min(1, (now - t0) / dur), e = ease(t), u = 1 - e;
      const x = u * u * u * p0.x + 3 * u * u * e * p1.x + 3 * u * e * e * p2.x + e * e * e * p3.x;
      const y = u * u * u * p0.y + 3 * u * u * e * p1.y + 3 * u * e * e * p2.y + e * e * e * p3.y;
      const s = s0 + (s1 - s0) * e;
      const tilt = Math.max(-18, Math.min(18, (x - px) * 1.2));
      px = x;
      flyer.style.width = flyer.style.height = s + 'px';
      flyer.style.transform = `translate(${x - s / 2}px, ${y - s / 2}px) rotate(${tilt}deg)`;
      if (Math.random() < sparkle)
        spawn(x + (Math.random() - 0.5) * s * 0.4, y + s * 0.2, (Math.random() - 0.5) * 0.5, Math.random() * 0.4, 40 + Math.random() * 30, 0.6 + Math.random() * 1.3);
      t < 1 ? requestAnimationFrame(step) : done();
    };
    requestAnimationFrame(step);
  });
}
function makeFlyer() {
  const f = document.createElement('div');
  f.className = 'flyer';
  f.append(tpl.content.cloneNode(true));
  document.body.append(f);
  return f;
}

let target = owl.parentElement, owlBusy = false, settle;
async function goTo(spot) {
  if (spot === owl.parentElement) return;
  if (reduce) { spot.append(owl); return; }
  owlBusy = true;
  const a = box(owl), flyer = makeFlyer();
  owl.classList.add('away');
  spot.append(owl);
  const b = box(owl);
  // glide in from the nearer screen edge, above the heading, so it never crosses the content
  const fromRight = b.x > W / 2, sx = fromRight ? W + 60 : -60, sy = Math.max(30, b.y - 150);
  await leg(flyer, [{ x: sx, y: sy }, { x: sx * 0.6 + b.x * 0.4, y: sy - 20 }, { x: b.x + (fromRight ? 90 : -90), y: b.y - 50 }, b], b.w * 0.9, b.w, 1000, 0.35);
  flyer.remove();
  owl.classList.remove('away');
  owlBusy = false;
  if (target !== owl.parentElement) goTo(target);
}
const perchObs = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) target = perches.get(e.target);
  clearTimeout(settle);
  settle = setTimeout(() => { if (!owlBusy) goTo(target); }, 220);
}, { rootMargin: '-30% 0px -45% 0px' });
perches.forEach((_, sec) => perchObs.observe(sec));

// "Send an owl": off with the letter (mail opens), then back to the window
$('[data-send-owl]').addEventListener('click', async e => {
  if (reduce || owlBusy) return;
  e.preventDefault();
  const href = e.currentTarget.href;
  owlBusy = true;
  const h = box(owl), flyer = makeFlyer();
  owl.classList.add('away');
  await leg(flyer, [h, { x: h.x + W * 0.15, y: h.y - H * 0.3 }, { x: W * 0.8, y: H * 0.1 }, { x: W + 120, y: -80 }], h.w, 70, 1300, 1);
  location.href = href;
  await sleep(600);
  const h2 = box(owl);
  await leg(flyer, [{ x: -120, y: H * 0.2 }, { x: W * 0.2, y: H * 0.1 }, { x: h2.x - 80, y: h2.y - H * 0.2 }, h2], 70, h2.w, 1600, 1);
  flyer.remove();
  owl.classList.remove('away');
  burst(h2.x, h2.y, 10);
  owlBusy = false;
  if (target !== owl.parentElement) goTo(target);
});

/* ---------- Marauder's-Map walker: footprints cross the top as you scroll ---------- */
const walker = $('.walker'), prints = $('.prints', walker), tag = $('.tag', walker), roomEl = $('.room', walker);
const corridor = $('.corridor', walker);
const STEP = 16;
let lastPrintX = null, side = 1, idle;
function placeTicks() {
  const max = root.scrollHeight - innerHeight;
  corridor.replaceChildren(...$$('main > section:not(.hero)').map(sec => {
    const i = document.createElement('i');
    i.style.left = Math.min(100, (sec.offsetTop / max) * 100) + '%';
    return i;
  }));
}
function walkerX() {
  const max = root.scrollHeight - innerHeight;
  return (max > 0 ? scrollY / max : 0) * (walker.clientWidth - 8);
}
function onWalk() {
  const x = walkerX();
  if (lastPrintX === null) lastPrintX = x;
  tag.style.left = x + 'px';
  // one print every STEP px of walking along the corridor, left/right feet alternating
  const dir = Math.sign(x - lastPrintX);
  while (Math.abs(x - lastPrintX) >= STEP) {
    lastPrintX += dir * STEP;
    side = -side;
    prints.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 20 40"><use href="#foot"/></svg>');
    const f = prints.lastChild;
    f.style.left = lastPrintX + 'px';
    f.style.top = 12 + side * 4 + 'px';
    f.style.transform = `rotate(${dir > 0 ? 90 : -90}deg)`;
    if (prints.children.length > 14) prints.firstChild.remove();
  }
  walker.classList.add('moving');
  clearTimeout(idle);
  idle = setTimeout(() => walker.classList.remove('moving'), 1200);
}
const topbar = $('.topbar');
addEventListener('scroll', () => { onWalk(); topbar.classList.toggle('scrolled', scrollY > 40); }, { passive: true });
addEventListener('resize', placeTicks);
addEventListener('load', placeTicks);
placeTicks();
onWalk();
const roomObs = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) roomEl.textContent = e.target.dataset.room;
}, { rootMargin: '-45% 0px -50% 0px' });
$$('main > section').forEach(s => roomObs.observe(s));

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

/* ---------- Spellbook: each spell shows where it was cast (only real project tags) ---------- */
const castIn = {
  Python: ['JobGenie', 'PhoniX', 'Session-Based Recommender', 'IBM internship'], Java: ['Library Management System'],
  SQL: ['Library Management System'], Swing: ['Library Management System'], PyTorch: ['PhoniX', 'Session-Based Recommender', 'IBM internship'],
  CNN: ['IBM internship'], 'GRU / LSTM': ['Session-Based Recommender (GRU)'], KAN: ['Session-Based Recommender'],
  'Gemini API': ['JobGenie'], RAG: ['JobGenie'], FastAPI: ['JobGenie'], PostgreSQL: ['JobGenie'], Docker: ['JobGenie'], Streamlit: ['IBM internship'],
};
$$('.panel').forEach(panel => {
  const out = document.createElement('p');
  out.className = 'proof';
  out.setAttribute('aria-live', 'polite');
  out.textContent = '✦ marks a spell I’ve used in a project below — tap one to see where.';
  panel.append(out);
  $$('.spells li', panel).forEach(li => {
    const name = li.textContent.trim(), where = castIn[name];
    if (!where) return;
    li.innerHTML = `<button type="button" class="spell" aria-pressed="false">${li.innerHTML}</button>`;
    $('button', li).addEventListener('click', e => {
      $$('.spell', panel).forEach(b => b.setAttribute('aria-pressed', b === e.currentTarget));
      const links = where.map(w => `<a href="${w.startsWith('IBM') ? '#journey' : '#room-of-requirement'}">${w}</a>`).join(' · ');
      out.innerHTML = `<strong>${name}</strong> was cast in: ${links}`;
    });
  });
});

/* ---------- House Points Ledger: LeetCode / GitHub heatmap from data/activity.json (updated daily) ---------- */
const fmt = d => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const iso = d => d.toISOString().slice(0, 10);
function streaks(days, end) {
  let cur = 0, best = 0, run = 0;
  const keys = Object.keys(days).filter(k => days[k] > 0).sort();
  for (let i = 0; i < keys.length; i++) {
    run = i && (new Date(keys[i]) - new Date(keys[i - 1])) / 864e5 === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  // today may not be logged yet, so the current streak may end yesterday
  const d = new Date(end);
  if (!(days[iso(d)] > 0)) d.setUTCDate(d.getUTCDate() - 1);
  for (; days[iso(d)] > 0; d.setUTCDate(d.getUTCDate() - 1)) cur++;
  return { cur, best };
}
function drawLedger(data, src) {
  const set = data[src], sum = $('.ledger-sum');
  if (!set) { sum.textContent = 'The ledger is closed today — try again later.'; return; }
  const end = new Date(data.updated + 'T00:00:00Z');
  const start = new Date(end);
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
  $('.ledger-upd').textContent = 'Updated ' + fmt(end);
  const sc = $('.ledger-scroll');
  sc.scrollLeft = sc.scrollWidth;
}
fetch('data/activity.json').then(r => r.json()).then(data => {
  if (data.leetcode?.solved?.All) $('[data-lc-solved]').textContent = data.leetcode.solved.All;
  drawLedger(data, 'leetcode');
  $$('.ledger-src button').forEach(b => b.addEventListener('click', () => {
    $$('.ledger-src button').forEach(x => x.setAttribute('aria-pressed', x === b));
    drawLedger(data, b.dataset.src);
  }));
}).catch(() => { $('.ledger-sum').textContent = 'The ledger is closed today — try again later.'; });

/* ---------- Live GitHub stats (public API; falls back to the static text) ---------- */
fetch('https://api.github.com/users/devSaksham/repos?per_page=100&type=owner').then(r => r.ok ? r.json() : Promise.reject()).then(repos => {
  const own = repos.filter(r => !r.fork), langs = {};
  own.forEach(r => { if (r.language) langs[r.language] = (langs[r.language] || 0) + 1; });
  const top = Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([l]) => l);
  $('[data-gh-repos]').textContent = `${own.length} repos`;
  if (top.length) $('[data-gh-sub]').textContent = `mostly ${top.join(' · ')} · @devSaksham`;
}).catch(() => {});

/* ---------- A note for whoever opens the console ---------- */
console.log(`%c
   ,_,
  (O,O)   Hello, fellow developer.
  (   )   This site is hand-written HTML, CSS and JS, no framework.
  -"-"-   Hiring, or want to build something? reach.saksham.agrawal@gmail.com
`, 'font-family: monospace; color: #c9a45c; font-size: 12px;');

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
