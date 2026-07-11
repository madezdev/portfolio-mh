import { useEffect, useRef } from 'react';

/**
 * Interactive blueprint: a grid of nodes that lights up near the cursor,
 * shifting from cool blueprint blue (concept) to warm ember (reality) — the
 * site "builds itself" where you point. Canvas-based for performance.
 * Reduced-motion → a static dim grid; touch/no-pointer → static grid.
 */
export function InteractiveBlueprint() {
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
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const GAP = 46;
    const RADIUS = 170;

    let width = 0;
    let height = 0;
    let nodes: { x: number; y: number }[] = [];
    const mouse = { x: -9999, y: -9999 };
    const smooth = { x: -9999, y: -9999 };
    let raf = 0;

    function resize() {
      const rect = parent.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      nodes = [];
      for (let x = GAP / 2; x < width; x += GAP) {
        for (let y = GAP / 2; y < height; y += GAP) nodes.push({ x, y });
      }
    }

    function drawGrid() {
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(107,138,255,0.05)';
      ctx.beginPath();
      for (let x = GAP / 2; x < width; x += GAP) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = GAP / 2; y < height; y += GAP) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
    }

    function tick() {
      smooth.x += (mouse.x - smooth.x) * 0.12;
      smooth.y += (mouse.y - smooth.y) * 0.12;
      drawGrid();
      for (const n of nodes) {
        const dist = Math.hypot(n.x - smooth.x, n.y - smooth.y);
        if (dist > RADIUS) continue;
        const t = 1 - dist / RADIUS; // proximity 0..1
        // blueprint (107,138,255) -> ember (255,106,26)
        const r = Math.round(107 + (255 - 107) * t);
        const g = Math.round(138 + (106 - 138) * t);
        const b = Math.round(255 + (26 - 255) * t);
        ctx.beginPath();
        ctx.fillStyle = `rgba(${r},${g},${b},${(0.1 + t * 0.9).toFixed(3)})`;
        if (t > 0.55) {
          ctx.shadowColor = 'rgba(255,106,26,0.8)';
          ctx.shadowBlur = 10 * t;
        }
        ctx.arc(n.x, n.y, 1 + t * 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      raf = requestAnimationFrame(tick);
    }

    function onMove(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }

    resize();
    window.addEventListener('resize', resize);

    if (reduce || window.matchMedia('(pointer: coarse)').matches) {
      drawGrid();
    } else {
      window.addEventListener('mousemove', onMove);
      raf = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
      style={{ maskImage: 'radial-gradient(ellipse at 50% 30%, black 45%, transparent 80%)', WebkitMaskImage: 'radial-gradient(ellipse at 50% 30%, black 45%, transparent 80%)' }}
    />
  );
}
