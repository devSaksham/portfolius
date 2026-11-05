const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

/* ---------- Lessons: [spell, task, accepted commands, what it does]. Every spell is used once, for one kind of magic. ---------- */
const YEARS = [
  ['Year 1', 'The Shell', [
    ['Revelio', 'Reveal everything in this room, the hidden things too.', ['ls -a', 'ls -la', 'ls -al', 'ls -A', 'ls -lA'], 'ls lists a folder; -a also shows hidden dotfiles like .env and .git.'],
    ['Point Me', 'Which way is it? Print exactly where you are standing.', ['pwd'], 'pwd prints the full path of the folder you are in.'],
    ['Apparate', 'Apparate into the folder called potions.', ['cd potions', 'cd potions/', 'cd ./potions'], 'cd changes directory. cd .. goes back up one level.'],
    ['Orchideous', 'Conjure a new, empty folder called spells.', ['mkdir spells', 'mkdir ./spells', 'mkdir -p spells'], 'mkdir makes a directory. Add -p to create nested ones in one go.'],
    ['Geminio', 'Duplicate map.txt as map-copy.txt.', ['cp map.txt map-copy.txt', 'cp ./map.txt ./map-copy.txt'], 'cp copies a file. Use cp -r to copy a whole folder.'],
    ['Accio', 'Summon every line that mentions wand from inventory.txt.', ['grep wand inventory.txt', 'grep "wand" inventory.txt'], 'grep prints the lines that match a pattern. Add -i to ignore case.'],
    ['Alohomora', 'Unlock door.sh so it can be run.', ['chmod +x door.sh', 'chmod u+x door.sh', 'chmod a+x door.sh', 'chmod 755 door.sh'], 'chmod changes permissions; +x makes a file executable.'],
    ['Evanesco', 'Vanish the file dungbomb.txt.', ['rm dungbomb.txt', 'rm ./dungbomb.txt', 'rm -f dungbomb.txt'], 'rm deletes a file for good. There is no undo, so cast it carefully.'],
  ]],
  ['Year 2', 'Git', [
    ['Lumos', 'Light up this folder: start a new git repository here.', ['git init'], 'git init creates a .git folder and starts tracking history.'],
    ['Specialis Revelio', 'Show what has changed, and what is staged.', ['git status'], 'git status shows modified, staged and untracked files.'],
    ['Wingardium Leviosa', 'Lift every change onto the stage.', ['git add .', 'git add -A', 'git add --all'], 'git add stages changes for the next commit.'],
    ['Colloportus', 'Seal your staged work with the message "add potions".', ['git commit -m "add potions"'], 'git commit -m saves a snapshot with a message.'],
    ['Portus', 'Create a new branch called quidditch and switch to it.', ['git switch -c quidditch', 'git checkout -b quidditch'], 'switch -c (or checkout -b) creates a branch and moves you onto it.'],
    ['Prior Incantato', 'Show the history of past spells, one line each.', ['git log --oneline', 'git log --pretty=oneline'], 'git log --oneline prints each commit as a short hash and message.'],
    ['Capacious Extremis', 'Tuck your unfinished changes into the bag for later, without losing them.', ['git stash', 'git stash push'], 'git stash shelves uncommitted changes so you get a clean tree.'],
    ['Finite Incantatem', 'End the stash: bring those shelved changes back.', ['git stash pop', 'git stash apply'], 'pop brings the stash back and drops it; apply keeps a copy in the stash.'],
    ['Reparo', 'Undo your last commit, but keep the changes.', ['git reset --soft HEAD~1', 'git reset --soft HEAD^', 'git reset --soft HEAD~'], 'reset --soft moves the branch back one commit and keeps your work staged.'],
  ]],
  ['Year 3', 'Docker & Processes', [
    ['Homenum Revelio', 'Who is in the castle? List every running process, with details.', ['ps aux', 'ps -ef'], 'ps aux shows every process with its owner, CPU and memory.'],
    ['Appare Vestigium', 'Find the traces: which program is holding port 3000?', ['lsof -i :3000', 'lsof -i:3000', 'lsof -i tcp:3000'], 'lsof -i :PORT shows the process listening on a port.'],
    ['Stupefy', 'Stop process 4242 at once, no arguing.', ['kill -9 4242', 'kill -KILL 4242', 'kill -SIGKILL 4242'], 'kill -9 sends SIGKILL, which cannot be ignored. Try plain kill first next time.'],
    ['Fianto Duri', 'Build an image tagged jobgenie from this folder.', ['docker build -t jobgenie .', 'docker build --tag jobgenie .', 'docker build . -t jobgenie'], 'docker build -t NAME . builds an image from the Dockerfile here.'],
    ['Expecto Patronum', 'Bring the jobgenie image to life, mapping port 8000 to 8000.', ['docker run -p 8000:8000 jobgenie', 'docker run --publish 8000:8000 jobgenie', 'docker run -d -p 8000:8000 jobgenie'], 'docker run starts a container; -p host:container publishes a port.'],
    ['Sonorus', 'Hear what the jobgenie container is saying, and keep listening.', ['docker logs -f jobgenie', 'docker logs --follow jobgenie'], 'docker logs prints what a container writes out; -f keeps streaming it.'],
    ['Scourgify', 'Clean away every stopped container.', ['docker container prune', 'docker container prune -f', 'docker container prune --force'], 'container prune removes all stopped containers. -f skips the question.'],
  ]],
];
const HOUSES = { gryffindor: 'Gryffindor', ravenclaw: 'Ravenclaw', hufflepuff: 'Hufflepuff', slytherin: 'Slytherin' };
const FIZZLE = ['The spell fizzles.', 'A puff of smoke, nothing more.', 'Close, but the wand only sputters.', 'Nothing happens. Check the incantation.'];

// compared like a real terminal: case matters; only spacing and quote style are forgiven
const norm = t => t.trim().replace(/[“”‘’']/g, '"').replace(/\s+/g, ' ');

let house = store.get('house', null), points = store.get('house-points', {}), done = store.get('spells-done', {});
let year = 0, lesson = 0, tries = 0, hinted = false, solved = false, choosing = matchMedia('(pointer: coarse)').matches;
const els = {
  houses: $$('[data-house]'), pts: $('.sc-points'), years: $('.sc-years'), count: $('.sc-count'), task: $('.sc-task'),
  form: $('.sc-term'), input: $('#sc-input'), choices: $('.sc-choices'), result: $('.sc-result'), progress: $('.sc-progress'),
  hint: $('[data-act="hint"]'), mode: $('[data-act="mode"]'), next: $('[data-act="next"]'),
};
const key = (y, l) => `${y}.${l}`;

function renderHouse() {
  document.body.dataset.house = house || '';
  els.houses.forEach(b => b.setAttribute('aria-checked', b.dataset.house === house));
  els.pts.textContent = house ? `${HOUSES[house]}: ${points[house] || 0} points`
    : points.unsorted ? `${points.unsorted} points waiting. Pick a house to claim them.` : 'Pick a house to start earning points (the Sorting Hat may already have chosen for you).';
}
function award(n) {
  const k = house || 'unsorted';
  points[k] = Math.max(0, (points[k] || 0) + n);
  store.set('house-points', points);
  renderHouse();
}

function renderYears() {
  els.years.replaceChildren(...YEARS.map(([y, name, ls], i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', i === year);
    const n = ls.filter((_, l) => done[key(i, l)]).length;
    b.innerHTML = `<b>${y}</b> ${name} <small>${n}/${ls.length}</small>`;
    b.addEventListener('click', () => { year = i; lesson = firstOpen(i); renderYears(); renderLesson(); });
    return b;
  }));
}
const firstOpen = y => { const i = YEARS[y][2].findIndex((_, l) => !done[key(y, l)]); return i < 0 ? 0 : i; };

function renderLesson() {
  const ls = YEARS[year][2], [, task] = ls[lesson];
  tries = 0; hinted = false; solved = false;
  els.input.disabled = false;
  els.count.textContent = `${YEARS[year][0]} · lesson ${lesson + 1} of ${ls.length}`;
  els.task.textContent = `“${task}”`;
  els.result.replaceChildren();
  els.result.className = 'sc-result';
  els.input.value = '';
  els.form.hidden = choosing;
  els.choices.hidden = !choosing;
  els.mode.textContent = choosing ? 'Type instead' : 'Choose instead';
  if (choosing) renderChoices(); else els.input.focus({ preventScroll: true });
  els.progress.replaceChildren(...ls.map((_, l) => {
    const li = document.createElement('li');
    li.className = (done[key(year, l)] ? 'done' : '') + (l === lesson ? ' now' : '');
    li.innerHTML = `<button type="button" aria-label="Lesson ${l + 1}${done[key(year, l)] ? ', cast' : ''}"></button>`;
    li.firstChild.addEventListener('click', () => { lesson = l; renderLesson(); });
    return li;
  }));
}
function renderChoices() {
  const ls = YEARS[year][2], right = ls[lesson][2][0];
  const others = ls.map(x => x[2][0]).filter(c => c !== right).sort(() => Math.random() - 0.5).slice(0, 2);
  els.choices.replaceChildren(...[right, ...others].sort(() => Math.random() - 0.5).map(c => {
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = `<code>${c}</code>`;
    b.addEventListener('click', () => cast(c, b));
    return b;
  }));
}

function cast(text, btn) {
  const t = norm(text);
  if (!t || solved) return;
  const [spell, , ok, why] = YEARS[year][2][lesson];
  if (/^(sudo )?rm -(rf|fr) \/\*?$/.test(t)) {
    award(-10);
    return say('curse', `<b>That is an Unforgivable Curse.</b> Ten points from ${house ? HOUSES[house] : 'your house'}. (It would delete everything on the machine.)`);
  }
  if (ok.map(norm).includes(t)) {
    const k = key(year, lesson), first = !done[k], gain = hinted || tries ? 5 : 10;
    if (first) { done[k] = 1; store.set('spells-done', done); award(gain); }
    solved = true;
    btn?.classList.add('right');
    $$('button', els.choices).forEach(b => (b.disabled = true));
    els.input.disabled = true;
    const plus = !first ? '' : house ? `+${gain} to ${HOUSES[house]}` : `+${gain}, kept until you pick a house`;
    const all = YEARS.every(([, , ls], y) => ls.every((_, l) => done[key(y, l)]));
    say('cast', `<p class="sc-spell">${spell}!</p><p><code>${ok[0]}</code> ${why}</p>${plus ? `<p class="sc-plus">${plus}</p>` : ''}${all && first ? '<p class="sc-plus"><b>Every spell cast. You have finished Spell Class.</b></p>' : ''}`);
    renderYears();
    $$('li', els.progress)[lesson].classList.add('done');
    els.next.focus({ preventScroll: true });
    return;
  }
  tries++;
  btn?.classList.add('wrong');
  if (btn) btn.disabled = true;
  // wrong capitals are the most common slip: say so instead of a plain fizzle
  const caseOnly = ok.some(c => norm(c).toLowerCase() === t.toLowerCase());
  say('fizzle', caseOnly ? 'So close. Commands are case-sensitive: check your capitals.' : `${FIZZLE[(Math.random() * FIZZLE.length) | 0]}${tries >= 2 && !hinted ? ' Try the hint.' : ''}`);
}
function say(kind, html) {
  els.result.className = 'sc-result ' + kind;
  els.result.innerHTML = html;
}

els.form.addEventListener('submit', e => { e.preventDefault(); cast(els.input.value); });
els.hint.addEventListener('click', () => {
  const [spell, , ok] = YEARS[year][2][lesson];
  hinted = true;
  // the tool plus its sub-command (git stash, docker run...), but never the whole answer
  const w = ok[0].split(' '), n = ['git', 'docker'].includes(w[0]) ? 2 : 1;
  const start = w.length > n ? w.slice(0, n).join(' ') + ' …' : [...w.slice(0, n - 1), w[n - 1][0] + '…'].join(' ');
  say('hint', `The spell is <b>${spell}</b>. It starts with <code>${start}</code>`);
});
els.mode.addEventListener('click', () => { choosing = !choosing; renderLesson(); });
els.next.addEventListener('click', () => {
  const n = YEARS[year][2].length;
  if (lesson + 1 < n) lesson++;
  else { year = (year + 1) % YEARS.length; lesson = firstOpen(year); renderYears(); } // after Year 3, back to Year 1
  renderLesson();
});
els.houses.forEach(b => b.addEventListener('click', () => {
  house = b.dataset.house;
  store.set('house', house);
  if (points.unsorted) { points[house] = (points[house] || 0) + points.unsorted; delete points.unsorted; store.set('house-points', points); }
  renderHouse();
}));

renderHouse();
renderYears();
lesson = firstOpen(0);
renderLesson();

/* Opened over the castle (as a frame): the way back just closes the frame, so the page and its music carry on */
if (/[?&]embed\b/.test(location.search) && window.parent !== window) {
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="./"]');
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault();
    try { window.parent.closeSpellClass(); } catch { window.top.location.href = a.href; }
  });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !e.target.closest('input')) { try { window.parent.closeSpellClass(); } catch {} } });
}
