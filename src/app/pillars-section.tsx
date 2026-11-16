"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { pillarsCopy, type Locale } from "./intro-content";
import { motionTokens, observeViewportReveal, primeGsapElements, scheduleMotionInit } from "./motion-tokens";

const PIXEL_STEPS = [64, 32, 16, 8, 4, 2, 1];
const TAU = Math.PI * 2;

function drawPillarArtwork(ctx: CanvasRenderingContext2D, w: number, h: number, variant: number, time: number) {
  ctx.save();
  ctx.scale(w / 640, h / 480);
  ctx.fillStyle = "#0B0B0B";
  ctx.fillRect(0, 0, 640, 480);
  ctx.lineWidth = 1.2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const breath = Math.sin(time * 0.23);
  const ink = "rgba(243,242,237,0.62)";
  const muted = "rgba(243,242,237,0.18)";
  const orange = "#FF4D00";
  const box = (x: number, y: number, width: number, height: number, radius = 8, stroke = ink, fill = "#101010") => {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.stroke();
  };
  const line = (x: number, y: number, endX: number, endY: number, stroke = muted) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = stroke;
    ctx.stroke();
  };
  const dot = (x: number, y: number, radius = 2, fill = ink) => {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.fillStyle = fill;
    ctx.fill();
  };
  const orbit = (x: number, y: number, radiusX: number, radiusY: number, phase: number) => {
    ctx.beginPath();
    ctx.ellipse(x, y, radiusX, radiusY, 0, 0, TAU);
    ctx.strokeStyle = muted;
    ctx.stroke();
    const angle = (time * 0.055 + phase) * TAU;
    dot(x + radiusX * Math.cos(angle), y + radiusY * Math.sin(angle), 2.5);
  };

  ctx.translate(0, breath * 3);
  if (variant === 0) {
    orbit(320, 240, 260, 180, 0.2);
    ctx.save();
    ctx.translate(292, 222);
    ctx.rotate(-0.055 + breath * 0.004);
    box(-188, -121, 354, 244, 12, muted, "#0D0D0D");
    box(-198, -132, 354, 244, 12);
    line(-198, -98, 156, -98);
    for (let i = 0; i < 3; i++) dot(-180 + i * 10, -115, 2, i === 0 ? orange : muted);
    box(-127, -121, 192, 12, 6, muted, "#151515");
    box(-176, -76, 57, 165, 4, muted, "#131313");
    for (let i = 0; i < 5; i++) line(-164, -56 + i * 22, -133, -56 + i * 22, i === 0 ? ink : muted);
    line(-99, -66, 31, -66, ink);
    line(-99, -52, -7, -52);
    box(-99, -31, 225, 64, 5, muted, "#191919");
    ctx.beginPath();
    ctx.moveTo(-84, 16);
    ctx.bezierCurveTo(-40, 13, -51, -17 + breath * 3, -2, -4);
    ctx.bezierCurveTo(46, 12, 51, -26, 111, -17);
    ctx.strokeStyle = ink;
    ctx.stroke();
    for (let i = 0; i < 3; i++) {
      box(-99 + i * 79, 48, 67, 41, 4, muted, "#131313");
      line(-87 + i * 79, 62, -61 + i * 79, 62, ink);
      line(-87 + i * 79, 74, -48 + i * 79, 74);
    }
    ctx.restore();
    ctx.save();
    ctx.translate(466, 286 + Math.sin(time * 0.3) * 4);
    ctx.rotate(0.085 + breath * 0.006);
    box(-57, -107, 114, 214, 19, ink, "#0B0B0B");
    box(-49, -98, 98, 194, 13, muted, "#171717");
    box(-17, -92, 34, 5, 2, muted, "#0B0B0B");
    line(-34, -64, 11, -64, ink);
    line(-34, -51, -4, -51);
    box(-34, -31, 68, 54, 5, muted, "#202020");
    for (let i = 0; i < 3; i++) {
      dot(-23, 40 + i * 15, 3, i === 0 ? ink : muted);
      line(-12, 40 + i * 15, 30 - i * 5, 40 + i * 15, ink);
    }
    line(-12, 86, 12, 86, ink);
    ctx.restore();
  } else if (variant === 1) {
    orbit(306, 240, 260, 172, 0.15);
    orbit(316, 246, 106, 70, 0.65);
    ctx.save();
    ctx.translate(173, 230);
    ctx.rotate(-0.065 + breath * 0.004);
    box(-86, -97, 175, 211, 13, muted, "#0D0D0D");
    for (let i = 0; i < 3; i++) {
      const y = -81 + i * 60;
      box(-99, y, 175, 48, 7, ink, i === 1 ? "#191919" : "#131313");
      for (let slot = 0; slot < 5; slot++) line(-81 + slot * 7, y + 16, -81 + slot * 7, y + 31);
      line(-31, y + 18, 15, y + 18, ink);
      line(-31, y + 29, 0, y + 29);
      dot(55, y + 24, 3, i === 1 ? orange : `rgba(243,242,237,${0.4 + Math.sin(time * 0.5 + i) * 0.15})`);
    }
    ctx.restore();
    ctx.save();
    ctx.translate(445, 236 + Math.sin(time * 0.28 + 1) * 4);
    ctx.rotate(0.055);
    const body = new Path2D();
    body.moveTo(-68, -66);
    body.lineTo(-68, 76);
    body.bezierCurveTo(-68, 110, 68, 110, 68, 76);
    body.lineTo(68, -66);
    ctx.fillStyle = "#141414";
    ctx.fill(body);
    ctx.strokeStyle = ink;
    ctx.stroke(body);
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(0, -66 + i * 47, 68, 21, 0, 0, Math.PI);
      ctx.strokeStyle = ink;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.ellipse(0, -66, 68, 21, 0, 0, TAU);
    ctx.fillStyle = "#202020";
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, -66, 43, 11, 0, 0, TAU);
    ctx.strokeStyle = muted;
    ctx.stroke();
    ctx.restore();
  } else {
    orbit(320, 240, 260, 184, 0.3);
    ctx.save();
    ctx.translate(319, 235);
    ctx.rotate(-0.055 + breath * 0.004);
    box(-172, -124, 344, 248, 9, muted, "#0E0E0E");
    box(-185, -139, 344, 248, 9);
    line(-185, -109, 159, -109);
    for (let i = 0; i < 3; i++) dot(-168 + i * 10, -124, 2, i === 0 ? orange : muted);
    line(-166, -88, -166, 88);
    line(141, -88, 141, 88);
    box(-149, -83, 273, 169, 2, muted, "#141414");
    line(-132, -65, -98, -65, ink);
    for (let i = 0; i < 3; i++) line(28 + i * 29, -65, 45 + i * 29, -65);
    ctx.font = "500 44px sans-serif";
    ctx.fillStyle = "#F3F2ED";
    ctx.fillText("Aa", -130, 2);
    line(-129, 21, -46, 21, ink);
    line(-129, 32, -65, 32);
    box(-129, 48, 56, 18, 3, ink, "rgba(243,242,237,0.08)");
    box(-18, -41, 124, 107, 3, muted, "#1B1B1B");
    ctx.beginPath();
    ctx.moveTo(-5, 50);
    ctx.bezierCurveTo(18, 11, 32, 47 + breath * 4, 51, 8);
    ctx.bezierCurveTo(66, -24, 85, 3, 94, -20);
    ctx.strokeStyle = ink;
    ctx.stroke();
    dot(75, -20, 9, "rgba(243,242,237,0.12)");
    ctx.strokeStyle = ink;
    ctx.strokeRect(-24, -47, 136, 119);
    for (const x of [-24, 112]) for (const y of [-47, 72]) box(x - 3, y - 3, 6, 6, 0, ink, "#0B0B0B");
    ctx.restore();
    ctx.save();
    ctx.translate(454 + Math.sin(time * 0.25) * 5, 311 + Math.cos(time * 0.25) * 4);
    ctx.rotate(-0.13);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 39);
    ctx.lineTo(11, 29);
    ctx.lineTo(20, 47);
    ctx.lineTo(28, 43);
    ctx.lineTo(19, 25);
    ctx.lineTo(34, 23);
    ctx.closePath();
    ctx.fillStyle = "#0B0B0B";
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function PillarVisual({ variant, title, paused }: { variant: number; title: string; paused: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animation = useRef({ time: 0, step: 0, entrance: 0 });

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!host || !canvas || !ctx) return;
    const offscreen = document.createElement("canvas");
    const offCtx = offscreen.getContext("2d");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const compact = matchMedia("(max-width: 767px)");
    const state = animation.current;
    let visible = false;
    let prepared = false;
    let frame = 0;
    let last = 0;
    let dpr = 1;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      const step = paused || reduced.matches ? PIXEL_STEPS.length - 1 : state.step;
      const block = PIXEL_STEPS[step] * dpr;
      const time = reduced.matches ? 0 : state.time;
      if (block <= dpr || !offCtx) {
        ctx.imageSmoothingEnabled = true;
        drawPillarArtwork(ctx, w, h, variant, time);
      } else {
        const sw = Math.max(1, Math.ceil(w / block));
        const sh = Math.max(1, Math.ceil(h / block));
        offscreen.width = sw;
        offscreen.height = sh;
        drawPillarArtwork(offCtx, sw, sh, variant, time);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(offscreen, 0, 0, sw, sh, 0, 0, w, h);
      }
      host.dataset.revealed = String(step === PIXEL_STEPS.length - 1);
    };

    const tick = (now: number) => {
      const interval = 1000 / (compact.matches ? 24 : 30);
      if (!last) last = now;
      const elapsed = now - last;
      if (elapsed >= interval) {
        const delta = Math.min(elapsed, 100);
        last = now - elapsed % interval;
        state.time += delta / 1000;
        state.entrance += delta;
        state.step = Math.min(PIXEL_STEPS.length - 1, Math.floor(state.entrance / (motionTokens.duration.panelReveal * 1000 / PIXEL_STEPS.length)));
        render();
      }
      frame = requestAnimationFrame(tick);
    };

    const sync = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      if (reduced.matches || paused) {
        state.step = PIXEL_STEPS.length - 1;
        state.entrance = motionTokens.duration.panelReveal * 1000;
        render();
      } else if (visible && !document.hidden) {
        frame = requestAnimationFrame(tick);
      }
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, compact.matches ? 1.5 : 2);
      canvas.width = Math.max(1, Math.round(host.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(host.clientHeight * dpr));
      if (prepared || visible || reduced.matches || paused) render();
    };
    const mediaChange = () => { resize(); sync(); };
    const prepIo = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      prepared = true;
      resize();
      prepIo.disconnect();
    }, { rootMargin: "800px 0px" });
    prepIo.observe(host);
    const io = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      visible = entry.isIntersecting;
      if (visible) {
        resize();
        sync();
      } else {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    }, { threshold: 0 });
    io.observe(host);
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", mediaChange);
    compact.addEventListener("change", mediaChange);
    return () => {
      cancelAnimationFrame(frame);
      prepIo.disconnect();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", mediaChange);
      compact.removeEventListener("change", mediaChange);
    };
  }, [variant, paused]);

  return <div ref={hostRef} role="img" aria-label={title} className="pillar-visual"><canvas ref={canvasRef} aria-hidden="true" /></div>;
}

export default function PillarsSection({ locale, paused }: { locale: Locale; paused: boolean }) {
  const root = useRef<HTMLElement>(null);
  const copy = pillarsCopy[locale];

  useEffect(() => {
    if (!root.current || paused) return;
    const host = root.current;
    return scheduleMotionInit(() => {
      const media = gsap.matchMedia(host);
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const cleanups: (() => void)[] = [];
        const panels = primeGsapElements(host.querySelectorAll<HTMLElement>(".pillar"), { opacity: true });
        panels.forEach(panel => {
          const tween = gsap.fromTo(panel, { opacity: 0, y: 40 }, {
            opacity: 1,
            y: 0,
            duration: motionTokens.duration.panelReveal,
            ease: motionTokens.ease.power2Out,
            paused: true,
            clearProps: "transform,opacity",
          });
          cleanups.push(observeViewportReveal(panel, () => { tween.play(); }));
        });
        return () => cleanups.forEach(fn => fn());
      });
      return () => media.revert();
    }, 32);
  }, [locale, paused]);

  return <section id="pillars" ref={root} className="pillars" aria-label={copy.label}>
    <div className="pillars-track" tabIndex={0} role="region" aria-label={copy.label} onKeyDown={event => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      const track = event.currentTarget;
      if (track.scrollWidth <= track.clientWidth) return;
      event.preventDefault();
      const card = track.querySelector<HTMLElement>(".pillar");
      track.scrollBy({ left: (event.key === "ArrowRight" ? 1 : -1) * ((card?.offsetWidth ?? 0) + 12), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    }}>
      {copy.items.map((pillar, index) => <article className="pillar" key={index}>
        <PillarVisual variant={index} title={pillar.title} paused={paused} />
        <div className="pillar-copy">
          <p className="pillar-label label">#{String(index + 1).padStart(2, "0")} · {pillar.label}</p>
          <h3>{pillar.title}</h3>
          <p className="pillar-description">{pillar.description}</p>
        </div>
      </article>)}
    </div>
  </section>;
}
