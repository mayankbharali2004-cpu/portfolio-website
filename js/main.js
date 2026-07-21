/* ================================================================
   MAYANK BHARALI — PORTFOLIO INTERACTIONS
   ----------------------------------------------------------------
   Plain vanilla JavaScript, no libraries. Six jobs:
     [1] HERO   — draw the sparkline + count the metrics up
     [2] REVEAL — fade-in sections as they scroll into view
     [3] NAV    — highlight the link for the section on screen
     [4] MENU   — open/close the mobile hamburger menu
     [5] MISC   — auto-update the footer year
     [6] TRAIL  — "data dust" particle trail behind the cursor

   Everything checks `prefersReduced` first: users who have
   "reduce motion" turned on in their OS get final values instantly
   with no animation. The site also works fine with JS disabled —
   all animation styles have safe CSS fallbacks.
   ================================================================ */

"use strict";

/* True if the user's OS asks for less motion (accessibility). */
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;


/* [1] ─── HERO: chart line drawing ──────────────────────────────
   Technique: set the SVG path's dash pattern to one dash exactly
   as long as the path, offset it fully (line invisible), then
   animate the offset to 0 so the line appears to draw itself.   */
const chartLine = document.getElementById("chartLine");
const heroPanel = document.querySelector(".hero__panel");

if (chartLine && heroPanel) {
  if (prefersReduced) {
    // No animation: just show everything immediately.
    heroPanel.classList.add("chart-done");
  } else {
    const length = chartLine.getTotalLength();
    chartLine.style.strokeDasharray = length;
    chartLine.style.strokeDashoffset = length;

    // Kick off shortly after load so it syncs with the hero fade-in.
    setTimeout(() => {
      chartLine.style.transition = "stroke-dashoffset 1.6s cubic-bezier(0.22, 1, 0.36, 1)";
      chartLine.style.strokeDashoffset = "0";
      // .chart-done fades in the area fill, break-even marker & dot
      // (their transition delays are defined in style.css).
      heroPanel.classList.add("chart-done");
    }, 500);
  }
}


/* [1b] ─── HERO: count-up metrics ───────────────────────────────
   Any element with data-count animates from 0 to that number.
   Optional attributes:
     data-decimals — decimal places to show (default 0)
     data-prefix   — text before the number  (e.g. "₹", "Month ")
     data-suffix   — text after the number   (e.g. "L+")
   Example: <dd data-count="22.6" data-decimals="1"
                data-prefix="₹" data-suffix="L+">                 */
function animateCount(el) {
  const target   = parseFloat(el.dataset.count);
  const decimals = parseInt(el.dataset.decimals || "0", 10);
  const prefix   = el.dataset.prefix || "";
  const suffix   = el.dataset.suffix || "";
  const duration = 1400; // ms

  if (prefersReduced) {
    el.textContent = prefix + target.toFixed(decimals) + suffix;
    return;
  }

  const start = performance.now();
  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    // ease-out cubic: fast start, gentle landing on the final value
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// Start counters slightly after the chart begins drawing.
setTimeout(() => {
  document.querySelectorAll("[data-count]").forEach(animateCount);
}, prefersReduced ? 0 : 700);


/* [2] ─── SCROLL REVEALS ────────────────────────────────────────
   IntersectionObserver watches every .reveal element; when ~15%
   of it enters the viewport it gets .is-visible, which triggers
   the CSS fade/slide transition. Each element animates once.    */
const revealEls = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window && !prefersReduced) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target); // animate once only
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );
  revealEls.forEach((el) => revealObserver.observe(el));
} else {
  // Old browser or reduced motion: show everything immediately.
  revealEls.forEach((el) => el.classList.add("is-visible"));
}


/* [3] ─── NAV SCROLL-SPY ────────────────────────────────────────
   Watches each section that has a nav link. Whichever section is
   currently crossing the middle of the viewport gets its link
   marked .is-active (green underline, styled in CSS).           */
const navLinks = document.querySelectorAll(".nav__link");
const sections = [...navLinks]
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

if ("IntersectionObserver" in window && sections.length) {
  const spyObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => {
            link.classList.toggle(
              "is-active",
              link.getAttribute("href") === "#" + entry.target.id
            );
          });
        }
      });
    },
    // A horizontal band around the viewport's middle: a section is
    // "active" while it occupies the centre of the screen.
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((sec) => spyObserver.observe(sec));
}


/* [4] ─── MOBILE MENU ───────────────────────────────────────────
   The hamburger button toggles .is-open on both itself (morphs
   into an X) and the links panel (slides into view). Clicking any
   link closes the menu again.                                   */
const navToggle = document.getElementById("navToggle");
const navMenu = document.getElementById("navLinks");

if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    const open = navMenu.classList.toggle("is-open");
    navToggle.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
  });

  navMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("is-open");
      navToggle.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}


/* [5] ─── FOOTER YEAR ───────────────────────────────────────────
   Keeps the copyright year current without manual edits.        */
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();


/* [6] ─── CURSOR TRAIL: "DATA DUST" ─────────────────────────────
   A particle trail that follows the mouse, matching the workbook
   theme: tiny green "cell" squares mixed with mono glyphs
   (₹ % ▲ digits), like data shaken loose from a spreadsheet.

   HOW IT WORKS
   - A full-screen <canvas> is created once and fixed on top of the
     page (pointer-events: none, so it never blocks clicks).
   - Moving the mouse spawns a particle every SPAWN_GAP pixels of
     travel. Each particle drifts, spins, shrinks and fades out.
   - INTERACTIVE: particles inside a small radius of the cursor get
     pushed away — sweep back through your own trail and it
     scatters. Clicking fires a burst of squares.
   - The animation loop only runs while particles exist; the page
     costs nothing when the mouse is idle.

   TUNING KNOBS (all in the CONFIG object below):
     maxParticles — hard cap, protects performance
     spawnGap     — px of mouse travel per particle (lower = denser)
     life         — how long a particle lives (ms)
     repelRadius  — how close the cursor must get to scatter dust

   Automatically DISABLED for: touch devices (no cursor to trail)
   and users with "reduce motion" enabled.                        */
(function cursorTrail() {
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  if (prefersReduced || isTouch) return;

  const CONFIG = {
    maxParticles: 110,
    spawnGap: 16,        // px of cursor travel between spawns
    life: [650, 1150],   // particle lifetime range, ms
    repelRadius: 55,     // px — cursor pushes particles away inside this
    repelForce: 0.55,
    glyphChance: 0.35,   // 35% glyphs, 65% squares
    glyphs: ["₹", "%", "+", "▲", "0", "1", "7", "="],
    // Colors from the site palette (see css/style.css block [0])
    colors: ["#0A6B3D", "#7FC79E", "#0A6B3D", "#C7CDC7", "#07522E"],
  };

  /* Build the overlay canvas. Created from JS so index.html stays
     clean — remove this whole [6] block to remove the effect.    */
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:999;";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  /* Keep the canvas sharp on high-DPI screens and in sync with the
     window size. devicePixelRatio maps CSS px → real pixels.     */
  let dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS pixels
  }
  resize();
  window.addEventListener("resize", resize);

  const particles = [];
  let mouseX = -100, mouseY = -100;   // current cursor position
  let lastX = null, lastY = null;     // last spawn position
  let rafId = null;                   // loop handle (null = idle)

  const rand = (a, b) => a + Math.random() * (b - a);

  /* Create one particle at (x, y). speed scales with how fast the
     cursor is moving, so quick flicks throw dust further.        */
  function spawn(x, y, speed) {
    if (particles.length >= CONFIG.maxParticles) particles.shift(); // drop oldest
    const isGlyph = Math.random() < CONFIG.glyphChance;
    particles.push({
      x: x + rand(-4, 4),
      y: y + rand(-4, 4),
      vx: rand(-0.5, 0.5) * (1 + speed * 0.04),
      vy: rand(-0.6, 0.25) * (1 + speed * 0.04), // slight upward bias
      size: isGlyph ? rand(9, 13) : rand(3, 6.5),
      rot: rand(0, Math.PI * 2),
      vr: rand(-0.05, 0.05),          // spin speed
      born: performance.now(),
      life: rand(CONFIG.life[0], CONFIG.life[1]),
      glyph: isGlyph ? CONFIG.glyphs[(Math.random() * CONFIG.glyphs.length) | 0] : null,
      color: CONFIG.colors[(Math.random() * CONFIG.colors.length) | 0],
    });
    if (rafId === null) rafId = requestAnimationFrame(tick); // wake the loop
  }

  /* Spawn along the cursor's path so fast moves leave a continuous
     trail instead of gaps.                                       */
  window.addEventListener("pointermove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (lastX === null) { lastX = mouseX; lastY = mouseY; return; }
    const dx = mouseX - lastX, dy = mouseY - lastY;
    const dist = Math.hypot(dx, dy);
    if (dist < CONFIG.spawnGap) return;
    const steps = Math.min((dist / CONFIG.spawnGap) | 0, 4);
    for (let i = 1; i <= steps; i++) {
      spawn(lastX + (dx * i) / steps, lastY + (dy * i) / steps, dist);
    }
    lastX = mouseX; lastY = mouseY;
  });

  /* Click burst: a quick pop of 8 squares from the click point.  */
  window.addEventListener("pointerdown", (e) => {
    for (let i = 0; i < 8; i++) {
      spawn(e.clientX, e.clientY, 22);
      const p = particles[particles.length - 1];
      const ang = (Math.PI * 2 * i) / 8 + rand(-0.3, 0.3);
      p.vx = Math.cos(ang) * rand(1.2, 2.4);
      p.vy = Math.sin(ang) * rand(1.2, 2.4);
    }
  });

  /* The render loop: physics + drawing. Stops itself (rafId=null)
     once every particle has expired.                             */
  function tick(now) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      const t = (now - p.born) / p.life;      // 0 → 1 over lifetime
      if (t >= 1) { particles.splice(i, 1); continue; }

      // Cursor repulsion — the "interactive" part: dust near the
      // pointer gets pushed outward, so you can stir your own trail.
      const dx = p.x - mouseX, dy = p.y - mouseY;
      const d = Math.hypot(dx, dy);
      if (d < CONFIG.repelRadius && d > 0.01) {
        const push = (1 - d / CONFIG.repelRadius) * CONFIG.repelForce;
        p.vx += (dx / d) * push;
        p.vy += (dy / d) * push;
      }

      // Drift + gentle friction so bursts settle instead of flying off
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.rot += p.vr;

      // Ease-out fade & shrink over the particle's life
      const fade = 1 - t * t;
      ctx.globalAlpha = fade * 0.85;
      ctx.fillStyle = p.color;

      if (p.glyph) {
        ctx.font = `500 ${p.size}px "IBM Plex Mono", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.glyph, p.x, p.y);
      } else {
        // A tiny rotating square — a spreadsheet "cell" shaken loose
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        const s = p.size * fade;
        ctx.fillRect(-s / 2, -s / 2, s, s);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;

    rafId = particles.length ? requestAnimationFrame(tick) : null;
  }
})();
