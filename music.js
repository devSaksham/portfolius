/* ---------- Castle music: one short loop, gapless, faded in and out ----------
   Browsers only allow sound after a tap or key press, so it never starts by itself on a first visit.
   Web Audio (not an <audio> tag) because only a decoded buffer loops with no gap. The first play starts at the
   very beginning, so it opens slow and quiet and builds; after that it loops from 5s, where the file's last
   seconds (the end fading out over the opening fading in) hand over seamlessly. It sits low under the page on
   purpose: background, never the main thing. The file is fetched only when someone shows interest (hovers the button, or the
   entrance screen is up), so nobody else downloads a byte of it.
   Inside the Spell Class overlay this page is an iframe: it borrows the castle page's player, so the music
   simply carries on. On a real page change it picks up where it stopped. */
(() => {
  const host = (() => { try { return window.parent !== window && window.parent.castleMusic; } catch { return null; } })();
  const M = host || player();
  window.castleMusic = M;

  // every [data-music] button: tap to toggle, hover/focus/touch to fetch early
  const btns = [...document.querySelectorAll('[data-music]')];
  const paint = () => btns.forEach(b => { b.setAttribute('aria-pressed', M.want); b.classList.toggle('waiting', M.want && !M.sounding); });
  btns.forEach(b => {
    b.addEventListener('click', () => M.toggle());
    ['pointerenter', 'focus', 'touchstart'].forEach(ev => b.addEventListener(ev, M.prefetch, { once: true, passive: true }));
  });
  M.subscribe(paint);
  addEventListener('pagehide', () => M.unsubscribe(paint));
  paint();

  // M toggles it from anywhere, except while typing (Spell Class has a command box)
  addEventListener('keydown', e => {
    if (e.key !== 'm' && e.key !== 'M' || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    if (e.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
    M.toggle();
  });

  function player() {
    const TRACK = { src: 'assets/music-p.mp3', loopStart: 5, loopEnd: 125 }; // seconds in the file
    const VOL = 0.22; // quiet on purpose
    if (navigator.audioSession) navigator.audioSession.type = 'playback'; // iPhone: play even with the silent switch on, like any music app
    let ctx, gain, buf, loading, src = null, startedAt = 0, offset = 0;
    const subs = new Set();
    const me = { want: false, sounding: false };
    const emit = () => subs.forEach(f => { try { f(me.want); } catch { subs.delete(f); } });
    const saved = (() => { try { return JSON.parse(sessionStorage.getItem('music')); } catch { return null; } })();
    const save = () => { try { sessionStorage.setItem('music', JSON.stringify({ want: me.want, pos: pos() })); } catch {} };

    const makeCtx = () => {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      gain = ctx.createGain(); gain.gain.value = 0; gain.connect(ctx.destination);
    };
    // where we are in the file: one pass from the start, then round and round the loop
    const pos = () => {
      if (!src) return offset;
      const p = offset + ctx.currentTime - startedAt, { loopStart: a, loopEnd: b } = TRACK;
      return p < b ? p : a + ((p - a) % (b - a));
    };
    const ramp = (to, sec) => {
      const g = gain.gain, t = ctx.currentTime;
      g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(to, t + sec);
    };
    me.prefetch = () => {
      if (!ctx) makeCtx();
      return (loading ||= fetch(TRACK.src).then(r => r.arrayBuffer()).then(a => new Promise((ok, no) => ctx.decodeAudioData(a, ok, no))).then(b => (buf = b)));
    };

    async function sound(fade) {
      if (!ctx) makeCtx();
      ctx.resume(); // inside the tap that started it, or the browser keeps it silent
      try { await me.prefetch(); } catch { me.want = false; emit(); return; }
      if (!me.want || src || document.hidden) return;
      await Promise.race([ctx.resume(), new Promise(r => setTimeout(r, 400))]); // a blocked resume() never settles
      if (ctx.state !== 'running') return armGesture(); // not allowed yet: the next tap or key starts it
      src = ctx.createBufferSource();
      Object.assign(src, { buffer: buf, loop: true, loopStart: TRACK.loopStart, loopEnd: TRACK.loopEnd });
      src.connect(gain);
      startedAt = ctx.currentTime;
      src.start(0, offset);
      ramp(VOL, fade);
      me.sounding = true; emit();
    }
    function hush(fade) {
      if (!src) return;
      offset = pos();
      ramp(0, fade);
      src.stop(ctx.currentTime + fade + 0.05);
      src = null;
      me.sounding = false; emit();
    }
    let armed = false;
    function armGesture() {
      if (armed) return; armed = true;
      const go = () => { armed = false; ['pointerdown', 'keydown'].forEach(ev => removeEventListener(ev, go, true)); if (me.want) sound(1.5); };
      ['pointerdown', 'keydown'].forEach(ev => addEventListener(ev, go, true));
    }

    me.play = (fade = 2.5) => { me.want = true; emit(); save(); return sound(fade); };
    me.pause = (fade = 0.8) => { me.want = false; hush(fade); emit(); save(); };
    me.toggle = () => (me.want ? me.pause() : me.play(1.5));
    me.subscribe = f => subs.add(f);
    me.unsubscribe = f => subs.delete(f);

    // a background tab goes quiet, and comes back softly
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { hush(0.3); save(); } else if (me.want) sound(1.2);
    });
    addEventListener('pagehide', save);

    // coming from another page of the site with music on: carry on from the same bar
    if (saved?.want) { me.want = true; offset = saved.pos || 0; sound(1.2); }
    return me;
  }
})();
