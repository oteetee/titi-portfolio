
  // Must exist before the async Spotify script below has any chance to call it,
  // so we use a promise instead of assigning the callback directly further down.
  window.spotifyIframeApiPromise = new Promise((resolve) => {
    window.onSpotifyIframeApiReady = resolve;
  });



  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });



function switchTab(index) {
  document.querySelectorAll('.tab').forEach((tab, i) => {
    tab.classList.toggle('active', i === index);
  });
  document.querySelectorAll('.panel').forEach((panel, i) => {
    panel.classList.toggle('active', i === index);
  });
  // Expand the section when Experience (1) or Capabilities (2) is active
  const section = document.querySelector('.about-section');
  if (section) {
    section.classList.toggle('expanded', index !== 0);
  }
}


// Hero: subtle mouse parallax on the photo, plus a gentle tilt on the gradient wash
(function () {
  const hero = document.querySelector('.hero');
  const imgSide = document.querySelector('.hero-image-side');
  const textSide = document.querySelector('.hero-text');
  if (!hero || !imgSide) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(hover: none)').matches) return; // skip on touch devices

  let targetX = 0, targetY = 0, curX = 0, curY = 0, rafId = null;

  hero.addEventListener('mousemove', (e) => {
    const r = hero.getBoundingClientRect();
    // -1 .. 1 across the hero
    targetX = ((e.clientX - r.left) / r.width - 0.5) * 2;
    targetY = ((e.clientY - r.top) / r.height - 0.5) * 2;
    if (!rafId) rafId = requestAnimationFrame(tick);
  });

  hero.addEventListener('mouseleave', () => {
    targetX = 0; targetY = 0;
    if (!rafId) rafId = requestAnimationFrame(tick);
  });

  function tick() {
    // ease toward the target so it glides instead of snapping
    curX += (targetX - curX) * 0.06;
    curY += (targetY - curY) * 0.06;
    imgSide.style.transform = `translate3d(${curX * 16}px, ${curY * 12}px, 0)`;
    // text drifts the opposite way, and less, so the two layers feel like depth
    if (textSide) textSide.style.transform = `translate3d(${curX * -7}px, ${curY * -5}px, 0)`;
    if (Math.abs(targetX - curX) > 0.001 || Math.abs(targetY - curY) > 0.001) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = null;
    }
  }
})();


// (My Products crate script removed — showcase rows use the reveal observer below)


// More Work carousel: continuous slow marquee loop with pause-on-hover, drag, arrows, and scrub
(function () {
  const track = document.getElementById('mw-carousel');
  const wrap = track ? track.parentElement : null;
  const progress = document.querySelector('.mw-progress');
  const bar = document.getElementById('mw-progress-bar');
  if (!track || !wrap || !progress) return;

  const originals = Array.from(track.querySelectorAll('.mw-card'));
  const n = originals.length;
  originals.forEach(c => track.appendChild(c.cloneNode(true)));
  track.style.transition = 'none';
  track.style.willChange = 'transform';

  const gap = 24;
  let setW = 1;
  function measure() {
    const cw = track.querySelector('.mw-card').offsetWidth + gap;
    setW = cw * n;
    return cw;
  }
  measure();
  window.addEventListener('resize', measure);

  let pos = 0;              // 0..setW, translateX = -pos
  const SPEED = 30;         // px/s drift, cards travel left to right
  let paused = false, dragging = false, didDrag = false, scrubbing = false;
  let animFrom = 0, animTo = 0, animT0 = 0, animDur = 0;

  function norm(p) { p %= setW; return p < 0 ? p + setW : p; }
  function render() {
    track.style.transform = 'translateX(' + (-pos) + 'px)';
    const view = Math.max(8, (wrap.offsetWidth / setW) * 100);
    const frac = norm(pos) / setW;
    bar.style.width = view + '%';
    bar.style.left = (frac * (100 - view)) + '%';
  }

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(64, now - last) / 1000; last = now;
    if (animDur > 0) {
      const t = Math.min(1, (now - animT0) / animDur);
      const e = 1 - Math.pow(1 - t, 3);
      pos = animFrom + (animTo - animFrom) * e;
      if (t >= 1) { animDur = 0; pos = norm(pos); }
    } else if (!paused && !dragging && !scrubbing) {
      pos = norm(pos - SPEED * dt);
    }
    render();
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  window.mwSlide = function (dir) {
    const cw = measure();
    animFrom = pos; animTo = pos + dir * cw;
    animT0 = performance.now(); animDur = 550;
  };

  wrap.addEventListener('mouseenter', () => { paused = true; });
  wrap.addEventListener('mouseleave', () => { paused = false; });

  let startX = 0, basePos = 0;
  wrap.addEventListener('pointerdown', e => {
    dragging = true; didDrag = false; startX = e.clientX; basePos = pos; animDur = 0;
    wrap.setPointerCapture(e.pointerId);
  });
  wrap.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 5) didDrag = true;
    pos = norm(basePos - dx);
  });
  const endDrag = () => { dragging = false; };
  wrap.addEventListener('pointerup', endDrag);
  wrap.addEventListener('pointercancel', endDrag);
  track.addEventListener('click', e => {
    if (didDrag) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  function scrubTo(e) {
    const r = progress.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    pos = frac * setW * 0.999;
  }
  progress.addEventListener('pointerdown', e => {
    scrubbing = true; progress.classList.add('scrubbing'); scrubTo(e);
    progress.setPointerCapture(e.pointerId);
  });
  progress.addEventListener('pointermove', e => { if (scrubbing) scrubTo(e); });
  progress.addEventListener('pointerup', () => { scrubbing = false; progress.classList.remove('scrubbing'); });
})();

// Click-to-copy email (Contact)
(function () {
  const btn = document.getElementById('emailCopyBtn');
  const toast = document.getElementById('emailCopyToast');
  if (!btn || !toast) return;

  let toastTimer = null;
  btn.addEventListener('click', () => {
    const email = btn.textContent.trim();
    const showToast = () => {
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).then(showToast).catch(showToast);
    } else {
      showToast();
    }
  });
})();

// Spotify widget, wired to real playback (Beyond the pixels)
(function () {
  const widget = document.getElementById('spotifyWidget');
  const playBtn = document.getElementById('spotifyPlayBtn');
  const iconPlay = document.getElementById('spotifyIconPlay');
  const iconPause = document.getElementById('spotifyIconPause');
  const embedTarget = document.getElementById('spotifyEmbedTarget');
  const track = document.getElementById('spotifyProgressTrack');
  const fill = document.getElementById('spotifyProgressFill');
  const elapsedEl = document.getElementById('spotifyTimeElapsed');
  const totalEl = document.getElementById('spotifyTimeTotal');
  if (!widget || !playBtn || !embedTarget) return;

  const PLAYLIST_URI = 'spotify:playlist:0xfiuDq27V96fhhAUgxWO9';
  const PLAYLIST_URL = 'https://open.spotify.com/playlist/0xfiuDq27V96fhhAUgxWO9?si=3IzaOKchQkac_oYKDg7Hhg';

  let controller = null;
  let lastDuration = 0;

  function formatTime(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return m + ':' + String(s).padStart(2, '0');
  }

  function setPlaying(playing) {
    playBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
    iconPlay.style.display = playing ? 'none' : 'block';
    iconPause.style.display = playing ? 'block' : 'none';
  }

  function updateProgress(position, duration) {
    lastDuration = duration || lastDuration;
    const pct = lastDuration ? Math.min(100, (position / lastDuration) * 100) : 0;
    fill.style.width = pct + '%';
    track.setAttribute('aria-valuenow', Math.round(pct));
    if (elapsedEl) elapsedEl.textContent = formatTime(position);
    if (totalEl) totalEl.textContent = formatTime(lastDuration);
  }

  // Official Spotify iFrame API: binds a real controller to a hidden embed,
  // so the play button actually starts/stops playback and the progress bar
  // reflects true position and duration, not a decorative animation.
  // Uses the promise set up earlier in <head> so this works regardless of
  // whether Spotify's async script finishes loading before or after this runs.
  window.spotifyIframeApiPromise.then((IFrameAPI) => {
    IFrameAPI.createController(embedTarget, {
      uri: PLAYLIST_URI,
      width: '100%',
      height: '152'
    }, (embedController) => {
      controller = embedController;
      controller.addListener('playback_update', (e) => {
        setPlaying(!e.data.isPaused);
        updateProgress(e.data.position, e.data.duration);
      });
    });
  });

  playBtn.addEventListener('click', () => {
    if (controller) {
      controller.togglePlay();
    } else {
      // API hasn't loaded (slow network or blocked), fall back to opening Spotify directly.
      window.open(PLAYLIST_URL, '_blank', 'noopener');
    }
  });

  if (track) {
    track.addEventListener('click', (e) => {
      if (!controller || !lastDuration) return;
      const rect = track.getBoundingClientRect();
      const fraction = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      controller.seek(Math.floor((fraction * lastDuration) / 1000));
    });
  }
})();




// Showcase rows: reveal on scroll
(function(){
  const rows = document.querySelectorAll('.show-row');
  if (!rows.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    rows.forEach(r => r.classList.add('in')); return;
  }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.22 });
  rows.forEach(r => io.observe(r));
})();



function openCase(id){
  document.body.classList.add('cs-open');
  document.querySelectorAll('.cs-page').forEach(function(p){ p.classList.toggle('is-on', p.id === id); });
  var prevBehavior = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = 'auto';
  requestAnimationFrame(function(){
    window.scrollTo(0, 0);
    setTimeout(function(){
      window.scrollTo(0, 0);
      document.documentElement.style.scrollBehavior = prevBehavior;
    }, 40);
  });
  var el = document.getElementById(id);
  if (el) el.querySelectorAll('.rv').forEach(function(n){ n.classList.add('in'); });
  window.scrollTo(0,0);
  try { if (location.hash !== '#' + id) history.pushState({cs:id}, '', '#' + id); } catch (e) {}
}
function closeCase(){
  document.body.classList.remove('cs-open');
  try { history.pushState({}, '', '#work'); } catch (e) {}
  var w = document.getElementById('work');
  if (w) {
    var prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    w.scrollIntoView();
    requestAnimationFrame(function(){
      w.scrollIntoView();
      document.documentElement.style.scrollBehavior = prev;
    });
  }
}
window.addEventListener('popstate', function(){
  var id = location.hash.slice(1);
  if (id.indexOf('case-') === 0 && document.getElementById(id)) openCase(id);
  else document.body.classList.remove('cs-open');
});
(function(){
  var id = location.hash.slice(1);
  if (id.indexOf('case-') === 0 && document.getElementById(id)) openCase(id);
})();
document.querySelectorAll('#nav a[href^="#"], #nav .nav-logo').forEach(function(a){
  a.addEventListener('click', function(){ document.body.classList.remove('cs-open'); });
});


(function(){
  /* email assembled at runtime so scrapers do not read it from the markup */
  var btn = document.getElementById('emailCopyBtn');
  var addr = '';
  if (btn) {
    addr = btn.getAttribute('data-u') + String.fromCharCode(64) + btn.getAttribute('data-d');
    btn.textContent = addr;
  }

  var form = document.getElementById('contactForm');
  if (!form) return;
  var status = document.getElementById('cfStatus');
  var send = form.querySelector('.cf-send');
  var cvLink = form.querySelector('.cf-cv');
  var cvHref = cvLink ? cvLink.getAttribute('href') : '#';

  var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M12 7.5v5.5"></path><path d="M12 16.4h.01"></path></svg>';

  function say(msg, ok){
    status.className = 'cf-status ' + (ok ? 'ok' : 'bad');
    status.innerHTML = ok ? msg : ICON + '<span>' + msg + '</span>';
  }

  function clearMarks(){
    form.querySelectorAll('.is-bad').forEach(function(n){
      n.classList.remove('is-bad');
      n.removeAttribute('aria-invalid');
    });
  }

  function mark(el){
    el.classList.add('is-bad');
    el.setAttribute('aria-invalid', 'true');
    el.addEventListener('input', function once(){
      el.classList.remove('is-bad');
      el.removeAttribute('aria-invalid');
      if (!form.querySelector('.is-bad')) { status.textContent = ''; status.className = 'cf-status'; }
      el.removeEventListener('input', once);
    });
  }

  function listOf(names){
    if (names.length === 1) return names[0];
    if (names.length === 2) return names[0] + ' and ' + names[1];
    return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    if (form._honey.value) return;

    var name = form.name.value.trim(),
        email = form.email.value.trim(),
        topic = form.topic.value,
        message = form.message.value.trim();

    clearMarks();
    var missing = [], bad = [];
    if (!name) { missing.push('your name'); bad.push(form.name); }
    if (!email) { missing.push('your email'); bad.push(form.email); }

    if (missing.length) {
      bad.forEach(mark);
      say('I still need ' + listOf(missing) + '.', false);
      bad[0].focus();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      mark(form.email);
      say('That email address does not look right. Check for a typo.', false);
      form.email.focus();
      return;
    }

    send.disabled = true;
    say('Sending.', true);

    var body = new URLSearchParams({
      'form-name': 'contact', name: name, email: email, topic: topic, message: message
    }).toString();

    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body
    }).then(function(r){
      return { ok: r.ok };
    }).then(function(d){
      if (d && d.ok) {
        var first = name.split(' ')[0];
        form.classList.add('is-sent');
        form.innerHTML =
          '<span class="cf-tab">Sent</span>' +
          '<div class="cf-done">' +
            '<span class="cf-done-mark" aria-hidden="true">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4.5 4.5L19 7"></path></svg>' +
            '</span>' +
            '<p class="cf-done-line">Thank you, ' + first + '. Your note is in my inbox.</p>' +
            '<p class="cf-done-sub">I read everything myself, so you will hear back from me at <strong>' + email + '</strong> within two days. If it is urgent, LinkedIn is the fastest way to nudge me.</p>' +
            '<div class="cf-done-actions">' +
              '<a class="cf-done-cv" href="' + cvHref + '" download="Titi-Arigbe-CV.pdf">Take my CV while you wait</a>' +
              '<button type="button" class="cf-done-again">Write another note</button>' +
            '</div>' +
          '</div>';
        var again = form.querySelector('.cf-done-again');
        if (again) again.addEventListener('click', function(){ location.reload(); });
      } else {
        throw new Error('no');
      }
    }).catch(function(){
      send.disabled = false;
      say('That did not send. Email me directly at ' + addr + ' and it will reach me.', false);
    });
  });
})();


(function(){
  var burger = document.getElementById('navBurger');
  var drawer = document.getElementById('navDrawer');
  if (!burger || !drawer) return;

  function setOpen(open){
    drawer.hidden = !open;
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
  }

  burger.addEventListener('click', function(){ setOpen(drawer.hidden); });

  drawer.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){
      document.body.classList.remove('cs-open');
      setOpen(false);
    });
  });

  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && !drawer.hidden) setOpen(false);
  });

  addEventListener('resize', function(){
    if (innerWidth > 900 && !drawer.hidden) setOpen(false);
  });
})();



(function(){
  function start(){
    if (!window.matchMedia('(max-width: 760px)').matches) return;
    var wraps = document.querySelectorAll('.beyond-strips .film-strip-wrap');
    if (!wraps.length) { setTimeout(start, 500); return; }

    var reels = [];
    wraps.forEach(function(wrap, i){
      var strip = wrap.querySelector('.film-strip');
      if (!strip) return;
      var half = strip.scrollWidth / 2;
      if (half < 60) { setTimeout(start, 600); return; }

      var r = {
        strip: strip, half: half,
        speed: (i === 0 ? -0.22 : 0.22),
        x: (i === 0 ? 0 : -half),
        dragging: false, startX: 0, startPos: 0, vel: 0, lastX: 0, lastT: 0
      };

      function norm(){
        while (r.x <= -r.half) r.x += r.half;
        while (r.x > 0) r.x -= r.half;
      }
      r.norm = norm;

      wrap.addEventListener('pointerdown', function(e){
        r.dragging = true; r.vel = 0;
        r.startX = e.clientX; r.startPos = r.x;
        r.lastX = e.clientX; r.lastT = e.timeStamp;
        wrap.setPointerCapture(e.pointerId);
      });
      wrap.addEventListener('pointermove', function(e){
        if (!r.dragging) return;
        r.x = r.startPos + (e.clientX - r.startX);
        var dt = e.timeStamp - r.lastT;
        if (dt > 0) r.vel = (e.clientX - r.lastX) / dt * 16;
        r.lastX = e.clientX; r.lastT = e.timeStamp;
        norm();
        r.strip.style.transform = 'translate3d(' + r.x + 'px,0,0)';
      });
      ['pointerup','pointercancel','pointerleave'].forEach(function(ev){
        wrap.addEventListener(ev, function(){ r.dragging = false; });
      });

      r.strip.style.transform = 'translate3d(' + r.x + 'px,0,0)';
      reels.push(r);
    });

    if (!reels.length) return;

    function frame(){
      reels.forEach(function(r){
        if (!r.dragging) {
          if (Math.abs(r.vel) > 0.1) { r.x += r.vel; r.vel *= 0.94; }
          else { r.x += r.speed; }
          r.norm();
          r.strip.style.transform = 'translate3d(' + r.x + 'px,0,0)';
        }
      });
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
  setTimeout(start, 2500);
})();



(function(){
  var box = null, stage = null, scale = 1, tx = 0, ty = 0, startDist = 0, startScale = 1, panX = 0, panY = 0, panning = false;

  function build(){
    box = document.createElement('div');
    box.className = 'dia-zoom';
    box.innerHTML = '<button class="dia-zoom-close" type="button" aria-label="Close">&times;</button>' +
                    '<div class="dia-zoom-stage"></div>' +
                    '<p class="dia-zoom-tip">pinch to zoom, drag to move</p>';
    document.body.appendChild(box);
    stage = box.querySelector('.dia-zoom-stage');
    box.querySelector('.dia-zoom-close').addEventListener('click', close);
    box.addEventListener('click', function(e){ if (e.target === box || e.target === stage) close(); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') close(); });

    box.addEventListener('touchstart', function(e){
      if (e.touches.length === 2) {
        startDist = dist(e.touches); startScale = scale;
      } else if (e.touches.length === 1) {
        panning = true; panX = e.touches[0].clientX - tx; panY = e.touches[0].clientY - ty;
      }
    }, {passive:true});
    box.addEventListener('touchmove', function(e){
      if (e.touches.length === 2) {
        scale = Math.min(6, Math.max(0.2, startScale * (dist(e.touches) / startDist)));
        apply();
      } else if (panning && e.touches.length === 1) {
        tx = e.touches[0].clientX - panX; ty = e.touches[0].clientY - panY; apply();
      }
    }, {passive:true});
    box.addEventListener('touchend', function(){ panning = false; });
    box.addEventListener('wheel', function(e){
      e.preventDefault();
      scale = Math.min(6, Math.max(0.2, scale - e.deltaY * 0.002)); apply();
    }, {passive:false});
  }
  function dist(t){
    var dx = t[0].clientX - t[1].clientX, dy = t[0].clientY - t[1].clientY;
    return Math.hypot(dx, dy);
  }
  function apply(){
    var svg = stage.querySelector('svg');
    if (svg) svg.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
  }
  function open(svg){
    if (!box) build();
    stage.innerHTML = '';
    var clone = svg.cloneNode(true);
    clone.style.width = '1240px';
    clone.style.height = 'auto';
    clone.style.background = svg.classList.contains('dia-dark') ? '#1C1512' : '#FFFCF8';
    clone.style.padding = '18px';
    clone.style.borderRadius = '10px';
    clone.style.boxSizing = 'content-box';
    stage.appendChild(clone);
    box.classList.add('on');
    document.body.style.overflow = 'hidden';
    clone.style.transform = 'none';
    var natural = clone.getBoundingClientRect().width || 1240;
    scale = (stage.clientWidth * 0.98) / natural * 1.8;
    tx = 0; ty = 0; apply();
  }
  function close(){
    if (!box) return;
    box.classList.remove('on');
    document.body.style.overflow = '';
  }

  function wire(){
    document.querySelectorAll('.dia-wrap').forEach(function(w){
      var svg = w.querySelector('svg.dia');
      if (!svg || w.dataset.zoomWired) return;
      w.dataset.zoomWired = '1';

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dia-expand';
      btn.setAttribute('aria-label', 'Expand diagram');
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6"></path><path d="M9 21H3v-6"></path><path d="M21 3l-7.5 7.5"></path><path d="M3 21l7.5-7.5"></path></svg>';
      btn.addEventListener('click', function(e){ e.stopPropagation(); open(svg); });
      w.appendChild(btn);

      svg.addEventListener('click', function(){ open(svg); });
    });
  }
  if (document.readyState === 'complete') wire();
  else window.addEventListener('load', wire);
  setTimeout(wire, 1500);
})();



(function(){
  function hide(f){
    if (!f || !f.src || f.src.indexOf('spotify.com') === -1) return;
    f.setAttribute('aria-hidden','true');
    f.setAttribute('tabindex','-1');
    f.style.cssText = 'position:absolute!important;left:-9999px!important;bottom:0!important;width:1px!important;height:1px!important;opacity:0!important;border:0!important;pointer-events:none!important;z-index:-1!important';
  }
  function sweep(){ document.querySelectorAll('iframe').forEach(hide); }
  var mo = new MutationObserver(function(muts){
    muts.forEach(function(m){
      m.addedNodes && m.addedNodes.forEach(function(n){
        if (n.nodeType !== 1) return;
        if (n.tagName === 'IFRAME') hide(n);
        else if (n.querySelectorAll) n.querySelectorAll('iframe').forEach(hide);
      });
    });
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
  sweep();
  [500, 1500, 3000, 6000].forEach(function(t){ setTimeout(sweep, t); });
})();
