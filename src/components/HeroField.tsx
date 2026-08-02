import { useEffect, useRef } from 'react';

/**
 * When the warm ignition wavefront starts, in seconds after mount. Exported so
 * StudioHero can time its GSAP entrance against it — the canvas sweep and the
 * DOM lighting must never drift apart.
 */
export const HERO_IGNITE_AT = 0.4;

/**
 * Vertical position of the studio "floor", as a fraction of the hero height.
 * Tuned to land in the gap between the CTA row and the scroll cue — the line is
 * the composition's one hard edge and must not graze either.
 */
export const HERO_HORIZON = 0.83;

/** Seconds for the wavefront to cross the section. */
const IGNITE_DURATION = 1.15;

const GAP_BASE = 52;
const MAX_NODES = 900;
const MAX_EMBERS = 26;
const LIGHT_RADIUS = 260;
const REPEL_RADIUS = 120;
const TAU = Math.PI * 2;

type FieldNode = { x: number; y: number; phase: number; speed: number; lit: number; reveal: number };
type Ember = { x: number; y: number; r: number; vy: number; drift: number; phase: number; alpha: number };

const clamp = (v: number, min: number, max: number) => (v < min ? min : v > max ? max : v);

/**
 * Cheap deterministic hash → 0..1. Keeps the composition reproducible across
 * reloads (and screenshots) without pulling in a PRNG.
 */
function hash(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * The living field behind the hero: a blueprint grid that is visible at rest,
 * nodes that twinkle out of phase, embers drifting up from the horizon, and a
 * light source that warms the grid, links nodes into a constellation and pushes
 * embers aside. On mount an ignition wavefront sweeps outward from the centre —
 * the studio switching on, which is the literal reading of "del concepto a la
 * realidad".
 *
 * Everything lives in one canvas and one RAF loop: a single compositing layer,
 * and embers that can react to the pointer (CSS keyframes cannot). The loop
 * pauses when the tab is hidden or the hero scrolls out of view.
 *
 * Without a fine pointer (touch) a roaming light drifts on a slow Lissajous
 * path, so the field is alive on mobile too. With reduced motion it draws a
 * single composed still — lit, not blank.
 */
export function HeroField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    const parentEl = canvasEl?.parentElement;
    const context = canvasEl?.getContext('2d');
    if (!canvasEl || !parentEl || !context) return;
    // Explicit non-null aliases so the closures below type-check.
    const canvas: HTMLCanvasElement = canvasEl;
    const parent: HTMLElement = parentEl;
    const ctx: CanvasRenderingContext2D = context;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = 0;
    let height = 0;
    let gap = GAP_BASE;
    let cols = 0;
    let rows = 0;
    let nodes: FieldNode[] = [];
    let embers: Ember[] = [];

    const light = { x: -9999, y: -9999 };
    const target = { x: -9999, y: -9999 };
    let pointerSeen = false;

    let elapsed = 0; // ms of animated time — only accumulates while running
    let last = 0;
    let raf = 0;
    let running = false;
    let inView = true;

    // Pre-rendered ember sprite: one drawImage per particle beats building a
    // radial gradient per particle per frame.
    const sprite = document.createElement('canvas');
    sprite.width = 32;
    sprite.height = 32;
    const sctx = sprite.getContext('2d');
    if (sctx) {
      const g = sctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      g.addColorStop(0, 'rgba(255,222,190,1)');
      g.addColorStop(0.25, 'rgba(255,138,61,0.8)');
      g.addColorStop(1, 'rgba(255,106,26,0)');
      sctx.fillStyle = g;
      sctx.fillRect(0, 0, 32, 32);
    }

    function makeEmber(i: number, seeded: boolean): Ember {
      return {
        x: hash(i * 3.1) * width,
        y: seeded
          ? hash(i * 5.7) * height
          : height * (HERO_HORIZON + 0.04) + hash(elapsed + i) * height * 0.22,
        r: 0.8 + hash(i * 2.3) * 1.4,
        vy: 8 + hash(i * 4.1) * 14,
        drift: 6 + hash(i * 6.9) * 10,
        phase: hash(i * 8.3) * TAU,
        alpha: 0.25 + hash(i * 9.7) * 0.65,
      };
    }

    function resize() {
      const rect = parent.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Widen the grid on large viewports so the node count stays bounded.
      gap = GAP_BASE;
      while (Math.ceil(width / gap) * Math.ceil(height / gap) > MAX_NODES) gap += 6;
      cols = Math.ceil(width / gap);
      rows = Math.ceil(height / gap);

      nodes = [];
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const i = c * rows + r;
          nodes.push({
            x: gap / 2 + c * gap,
            y: gap / 2 + r * gap,
            phase: hash(i) * TAU,
            speed: 0.4 + hash(i + 7) * 0.7,
            lit: 0,
            reveal: 0,
          });
        }
      }

      const count = Math.min(MAX_EMBERS, Math.max(8, Math.round((width * height) / 48000)));
      embers = Array.from({ length: count }, (_, i) => makeEmber(i, true));

      if (!pointerSeen) {
        target.x = width * 0.5;
        target.y = height * 0.42;
      }
      if (light.x < 0) {
        light.x = target.x;
        light.y = target.y;
      }
    }

    function step(dt: number) {
      const t = elapsed / 1000;

      // No pointer (or none yet): the light roams so the room still breathes.
      if (!pointerSeen) {
        target.x = width * (0.5 + 0.3 * Math.sin(t * 0.21));
        target.y = height * (0.42 + 0.22 * Math.sin(t * 0.31 + 1.1));
      }
      const k = 1 - Math.exp(-dt * 7);
      light.x += (target.x - light.x) * k;
      light.y += (target.y - light.y) * k;

      for (let i = 0; i < embers.length; i++) {
        const e = embers[i];
        e.y -= e.vy * dt;
        e.x += Math.sin(t * 0.6 + e.phase) * e.drift * dt;

        const dx = e.x - light.x;
        const dy = e.y - light.y;
        const d = Math.hypot(dx, dy);
        if (d < REPEL_RADIUS && d > 0.01) {
          const push = (1 - d / REPEL_RADIUS) * 26 * dt;
          e.x += (dx / d) * push;
          e.y += (dy / d) * push;
        }

        if (e.y < -30 || e.x < -40 || e.x > width + 40) {
          embers[i] = makeEmber(i, false);
          embers[i].y = height + 20;
        }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      const t = elapsed / 1000;
      const ign = clamp((t - HERO_IGNITE_AT) / IGNITE_DURATION, 0, 1);
      if (ign <= 0) return;

      const eased = 1 - Math.pow(1 - ign, 3);
      const cx = width / 2;
      const cy = height * 0.42;
      const front = eased * Math.hypot(width, height) * 0.68;

      // --- Blueprint grid: cool everywhere, warming inside the light radius ---
      ctx.beginPath();
      for (let c = 0; c < cols; c++) {
        const x = gap / 2 + c * gap;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let r = 0; r < rows; r++) {
        const y = gap / 2 + r * gap;
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(107,138,255,${(0.14 * eased).toFixed(3)})`;
      ctx.stroke();

      // Re-stroke the same path through a radial gradient centred on the light:
      // the grid warms toward ember where the light falls, and the gradient is
      // fully transparent past LIGHT_RADIUS so the rest is untouched.
      const warm = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, LIGHT_RADIUS);
      warm.addColorStop(0, `rgba(255,106,26,${(0.22 * eased).toFixed(3)})`);
      warm.addColorStop(0.55, `rgba(255,106,26,${(0.08 * eased).toFixed(3)})`);
      warm.addColorStop(1, 'rgba(255,106,26,0)');
      ctx.strokeStyle = warm;
      ctx.stroke();

      // --- Ignition wavefront ---
      if (ign < 1) {
        const inner = Math.max(0, front - 110);
        const outer = front + 40;
        if (outer > inner) {
          const wave = ctx.createRadialGradient(cx, cy, inner, cx, cy, outer);
          wave.addColorStop(0, 'rgba(255,106,26,0)');
          wave.addColorStop(0.7, `rgba(255,138,61,${(0.22 * (1 - ign)).toFixed(3)})`);
          wave.addColorStop(0.93, `rgba(255,227,207,${(0.32 * (1 - ign)).toFixed(3)})`);
          wave.addColorStop(1, 'rgba(255,106,26,0)');
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = wave;
          ctx.fillRect(0, 0, width, height);
          ctx.globalCompositeOperation = 'source-over';
        }
      }

      // --- Nodes: proximity to the light, plus reveal behind the wavefront ---
      const bucketA: number[] = [];
      const bucketB: number[] = [];
      const bucketC: number[] = [];
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.reveal = clamp((front - Math.hypot(n.x - cx, n.y - cy)) / 140, 0, 1);
        if (n.reveal <= 0.01) {
          n.lit = 0;
          continue;
        }
        const d = Math.hypot(n.x - light.x, n.y - light.y);
        n.lit = d < LIGHT_RADIUS ? 1 - d / LIGHT_RADIUS : 0;

        const twinkle = 0.5 + 0.5 * Math.sin(t * n.speed + n.phase);
        const a = (0.14 + twinkle * 0.24) * n.reveal;
        const bucket = a < 0.21 ? bucketA : a < 0.31 ? bucketB : bucketC;
        bucket.push(n.x, n.y);
      }
      // ~900 dots in three fills instead of 900.
      const buckets: Array<[number[], number]> = [
        [bucketA, 0.16],
        [bucketB, 0.26],
        [bucketC, 0.36],
      ];
      for (const [points, alpha] of buckets) {
        if (points.length === 0) continue;
        ctx.fillStyle = `rgba(157,176,255,${alpha})`;
        ctx.beginPath();
        for (let i = 0; i < points.length; i += 2) ctx.rect(points[i] - 0.9, points[i + 1] - 0.9, 1.8, 1.8);
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'lighter';

      // --- Constellation: lit neighbours wire themselves together ---
      ctx.lineWidth = 1;
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const n = nodes[c * rows + r];
          if (n.lit <= 0.08) continue;
          const right = c + 1 < cols ? nodes[(c + 1) * rows + r] : null;
          const down = r + 1 < rows ? nodes[c * rows + r + 1] : null;
          for (const m of [right, down]) {
            if (!m || m.lit <= 0.08) continue;
            const a = Math.min(n.lit, m.lit);
            ctx.strokeStyle = `rgba(255,138,61,${(a * a * 0.4).toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(m.x, m.y);
            ctx.stroke();
          }
        }
      }

      // --- Lit nodes: blueprint blue → ember by proximity ---
      for (const n of nodes) {
        if (n.lit <= 0 || n.reveal <= 0.01) continue;
        const tt = n.lit * n.reveal;
        const r = Math.round(107 + (255 - 107) * tt);
        const g = Math.round(138 + (106 - 138) * tt);
        const b = Math.round(255 + (26 - 255) * tt);
        ctx.beginPath();
        ctx.fillStyle = `rgba(${r},${g},${b},${(0.12 + tt * 0.62).toFixed(3)})`;
        if (tt > 0.55) {
          ctx.shadowColor = 'rgba(255,106,26,0.75)';
          ctx.shadowBlur = 10 * tt;
        }
        ctx.arc(n.x, n.y, 1 + tt * 2.4, 0, TAU);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // --- Embers ---
      for (const e of embers) {
        const reveal = clamp((front - Math.hypot(e.x - cx, e.y - cy)) / 160, 0, 1);
        if (reveal <= 0.01) continue;
        const fade = clamp(e.y / (height * 0.35), 0, 1);
        ctx.globalAlpha = e.alpha * reveal * fade;
        const size = e.r * 9;
        ctx.drawImage(sprite, e.x - size / 2, e.y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    function frame(now: number) {
      const dt = Math.min(now - last, 50);
      last = now;
      elapsed += dt;
      step(dt / 1000);
      draw();
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (running || reduce) return;
      running = true;
      canvas.dataset.running = 'true';
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      if (!running) return;
      running = false;
      canvas.dataset.running = 'false';
      cancelAnimationFrame(raf);
    }

    function onResize() {
      resize();
      refreshBounds();
      if (reduce) drawStill();
    }

    /** Reduced motion still: fully ignited, light parked above the headline. */
    function drawStill() {
      elapsed = (HERO_IGNITE_AT + IGNITE_DURATION) * 1000 + 4200;
      target.x = width * 0.5;
      target.y = height * 0.4;
      light.x = target.x;
      light.y = target.y;
      draw();
    }

    let bounds = canvas.getBoundingClientRect();
    function refreshBounds() {
      bounds = canvas.getBoundingClientRect();
    }

    function onMove(e: MouseEvent) {
      pointerSeen = true;
      target.x = e.clientX - bounds.left;
      target.y = e.clientY - bounds.top;
    }

    function onVisibility() {
      if (document.hidden) stop();
      else if (inView) start();
    }

    resize();

    if (reduce) {
      drawStill();
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }

    // A hero canvas must not burn CPU while the visitor reads the sections below.
    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView && !document.hidden) start();
        else stop();
      },
      { threshold: 0 },
    );
    observer.observe(parent);

    if (!coarse) window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', refreshBounds, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    start();

    return () => {
      stop();
      observer.disconnect();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', refreshBounds);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
      style={{
        maskImage: 'radial-gradient(ellipse 92% 88% at 50% 46%, black 42%, transparent 94%)',
        WebkitMaskImage: 'radial-gradient(ellipse 92% 88% at 50% 46%, black 42%, transparent 94%)',
      }}
    />
  );
}
