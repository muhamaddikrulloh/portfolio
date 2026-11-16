"use client";

import { useEffect, useRef } from "react";

type StarNode = {
  x: number;
  y: number;
};

const FADE_RADIUS = 250;
const FOLLOW_SPEED = 0.05;
const MORPH_STRENGTH = 1.6;

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  ctx.beginPath();
  const outer = radius * 1.5;
  const inner = outer * 0.4;
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const angle = (i * Math.PI) / 4 - Math.PI / 2;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

export default function HeroDotField({ paused }: { paused: boolean }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const syncRef = useRef<() => void>(() => {});

  useEffect(() => { pausedRef.current = paused; syncRef.current(); }, [paused]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    const hero = wrapper?.parentElement;
    const portrait = hero?.querySelector<HTMLElement>(".hero-portrait");
    const image = portrait?.querySelector<HTMLImageElement>("img");
    const context = canvas?.getContext("2d");
    if (!wrapper || !canvas || !hero || !portrait || !image || !context) return;

    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let stars: StarNode[] = [];
    let width = 0;
    let height = 0;
    let visible = true;
    let frame = 0;
    let previous = 0;
    let cursorX = -1000;
    let cursorY = -1000;
    let targetCursorX = -1000;
    let targetCursorY = -1000;
    let hasPointer = false;

    function draw() {
      context!.clearRect(0, 0, width, height);
      const activeCursor = !preference.matches && (hasPointer || cursorX > -500);
      const mobile = width < 900;
      const baseRadius = mobile ? 2.2 : 2.8;
      const outer = baseRadius * 1.5;
      const inner = outer * 0.4;
      const starOffsets: [number, number][] = [];
      for (let i = 0; i < 8; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const angle = (i * Math.PI) / 4 - Math.PI / 2;
        starOffsets.push([Math.cos(angle) * r, Math.sin(angle) * r]);
      }

      context!.fillStyle = "rgb(105, 105, 102)";
      context!.globalAlpha = 0.40;
      context!.beginPath();
      const hoveredStars: { star: StarNode; hoverFactor: number }[] = [];

      for (const star of stars) {
        let hoverFactor = 0;
        if (activeCursor) {
          const dx = star.x - cursorX;
          const dy = star.y - cursorY;
          const distSq = dx * dx + dy * dy;
          if (distSq < FADE_RADIUS * FADE_RADIUS) {
            hoverFactor = 1 - Math.sqrt(distSq) / FADE_RADIUS;
            hoveredStars.push({ star, hoverFactor });
            continue;
          }
        }
        context!.moveTo(star.x + starOffsets[0][0], star.y + starOffsets[0][1]);
        for (let i = 1; i < 8; i++) {
          context!.lineTo(star.x + starOffsets[i][0], star.y + starOffsets[i][1]);
        }
      }
      context!.closePath();
      context!.fill();

      for (const { star, hoverFactor } of hoveredStars) {
        const size = baseRadius * (1 + (MORPH_STRENGTH - 1) * hoverFactor);
        const r = Math.round(92 + (255 - 92) * hoverFactor);
        const g = Math.round(92 + (77 - 92) * hoverFactor);
        const b = Math.round(90 + (0 - 90) * hoverFactor);
        const a = 0.36 + (0.92 - 0.36) * hoverFactor;
        context!.fillStyle = `rgb(${r}, ${g}, ${b})`;
        context!.globalAlpha = a;
        drawStar(context!, star.x, star.y, size);
      }

      context!.globalAlpha = 1;
      wrapper!.dataset.ready = "true";
    }

    function running() { return visible && !document.hidden && !pausedRef.current && !preference.matches; }

    function tick(now: number) {
      frame = 0;
      if (!running()) return;
      if (!previous || now - previous >= 1000 / (width < 900 ? 20 : 60)) {
        previous = now;
        if (hasPointer) {
          if (cursorX <= -500) {
            cursorX = targetCursorX;
            cursorY = targetCursorY;
          } else {
            cursorX += (targetCursorX - cursorX) * FOLLOW_SPEED;
            cursorY += (targetCursorY - cursorY) * FOLLOW_SPEED;
          }
        } else if (cursorX > -500) {
          cursorX += (-1000 - cursorX) * FOLLOW_SPEED;
          cursorY += (-1000 - cursorY) * FOLLOW_SPEED;
        }
        draw();
      }
      if (hasPointer || cursorX > -500) frame = requestAnimationFrame(tick);
    }

    function sync() {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
      if (!visible || document.hidden || !stars.length) return;
      draw();
      if (running() && (hasPointer || cursorX > -500)) frame = requestAnimationFrame(tick);
    }

    let rebuildFrame = 0;
    let lastW = 0;
    let lastH = 0;

    function rebuild() {
      rebuildFrame = 0;
      if (!image!.complete || !image!.naturalWidth) return;
      const box = wrapper!.getBoundingClientRect();
      if (
        stars.length > 0 &&
        Math.abs(box.width - lastW) < 0.5 &&
        Math.abs(box.height - lastH) < 0.5
      ) {
        return;
      }
      width = lastW = box.width;
      height = lastH = box.height;
      if (!width || !height) return;
      const ratio = Math.min(devicePixelRatio || 1, width < 900 ? 1 : 1.5);
      canvas!.width = Math.round(width * ratio);
      canvas!.height = Math.round(height * ratio);
      context!.setTransform(ratio, 0, 0, ratio, 0, 0);

      stars = [];
      const mobile = width < 900;
      const spacing = 30;
      const offsetX = (width % spacing) / 2;
      const offsetY = (height % spacing) / 2;

      for (let starY = offsetY + (mobile ? 18 : 15); starY < height; starY += spacing) {
        for (let starX = offsetX + spacing; starX < width; starX += spacing) {
          stars.push({
            x: starX,
            y: starY,
          });
        }
      }
      sync();
    }

    function move(event: PointerEvent) {
      if (!running() || event.pointerType === "touch") return;
      const box = hero!.getBoundingClientRect();
      targetCursorX = event.clientX - box.left;
      targetCursorY = event.clientY - box.top;
      hasPointer = true;
      if (!frame) frame = requestAnimationFrame(tick);
    }
    function leave() {
      hasPointer = false;
    }

    function scheduleRebuild() {
      cancelAnimationFrame(rebuildFrame);
      rebuildFrame = requestAnimationFrame(rebuild);
    }

    const resize = new ResizeObserver(scheduleRebuild);
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    resize.observe(wrapper);
    intersection.observe(wrapper);
    image.addEventListener("load", scheduleRebuild);
    hero.addEventListener("pointermove", move, { passive: true });
    hero.addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", sync);
    preference.addEventListener("change", sync);
    syncRef.current = sync;
    scheduleRebuild();

    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(rebuildFrame);
      resize.disconnect();
      intersection.disconnect();
      image.removeEventListener("load", scheduleRebuild);
      hero.removeEventListener("pointermove", move);
      hero.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", sync);
      preference.removeEventListener("change", sync);
      syncRef.current = () => {};
    };
  }, []);

  return <div ref={wrapperRef} className="hero-dot-field" data-ready="false" aria-hidden="true"><canvas ref={canvasRef} /></div>;
}
