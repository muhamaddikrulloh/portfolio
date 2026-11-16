"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

type PortraitProps = { paused: boolean; alt: string; label: string; hint: string };
type AsciiArtwork = {
  format: "portrait-ascii-v1";
  columns: number;
  rows: number;
  lines: [number, string][];
  source: { width: number; height: number; crop: { left: number; top: number; width: number; height: number } };
};
const imageSizes = "(max-width: 382px) 92vw, (max-width: 899px) 352px, 57vw";

export default function HeroPortrait({ paused, alt, label, hint }: PortraitProps) {
  const [unavailable, setUnavailable] = useState(false);
  const [painted, setPainted] = useState(false);
  const [latched, setLatched] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hitAreaRef = useRef<HTMLSpanElement>(null);
  const drawRef = useRef<() => void>(() => {});
  const paintRef = useRef<(x: number, y: number) => void>(() => {});
  const clearPaintRef = useRef<(immediate?: boolean) => void>(() => {});
  const pointerType = useRef("");
  const pausedRef = useRef(paused);
  const progress = useRef({ value: 0 });

  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useEffect(() => {
    const button = buttonRef.current;
    const image = imageRef.current;
    const canvas = canvasRef.current;
    const hitArea = hitAreaRef.current;
    if (!button || !image || !canvas || !hitArea) return;
    const context = canvas.getContext("2d");
    if (!context) { setUnavailable(true); return; }
    const photo = document.createElement("canvas");
    const ascii = document.createElement("canvas");
    const mask = document.createElement("canvas");
    const revealed = document.createElement("canvas");
    const hitMap = document.createElement("canvas");
    const photoContext = photo.getContext("2d")!;
    const asciiContext = ascii.getContext("2d")!;
    const maskContext = mask.getContext("2d")!;
    const revealContext = revealed.getContext("2d")!;
    const hitContext = hitMap.getContext("2d", { willReadFrequently: true })!;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let alphaPixels: Uint8ClampedArray = new Uint8ClampedArray(0);
    let artwork: AsciiArtwork | null = null;
    let fontsReady = false;
    let fontFamily = "";
    let fontTimeout = 0;

    function fail() {
      if (disposed) return;
      button!.dataset.asciiSource = "unavailable";
      setUnavailable(true);
    }
    let width = 0;
    let height = 0;
    let ratio = 1;
    let disposed = false;
    let prepared = false;
    let frame = 0;
    let animFrame = 0;

    const pointer = {
      x: -1000,
      y: -1000,
      lx: -1000,
      ly: -1000,
      l2x: -1000,
      l2y: -1000,
      targetAct: 0,
      act: { value: 0 },
    };

    function draw() {
      if (!prepared || disposed) return;
      const amount = progress.current.value;
      const act = pointer.act.value;
      context!.clearRect(0, 0, width, height);
      maskContext.clearRect(0, 0, width, height);
      revealContext.clearRect(0, 0, width, height);

      if (amount <= 0.002 && act <= 0.002) {
        context!.drawImage(ascii, 0, 0, width, height);
        return;
      }
      if (amount >= 0.998) {
        context!.drawImage(photo, 0, 0, width, height);
        return;
      }

      if (amount > 0.002) {
        maskContext.fillStyle = `rgba(255, 255, 255, ${amount})`;
        maskContext.fillRect(0, 0, width, height);
      }

      if (act > 0.002) {
        const lensR = Math.min(width, height) * 0.22 * act;

        const g1 = maskContext.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, lensR);
        g1.addColorStop(0, "rgba(255, 255, 255, 1)");
        g1.addColorStop(0.25, "rgba(255, 255, 255, 0.75)");
        g1.addColorStop(0.5, "rgba(255, 255, 255, 0.3)");
        g1.addColorStop(0.75, "rgba(255, 255, 255, 0.06)");
        g1.addColorStop(1, "rgba(255, 255, 255, 0)");
        maskContext.fillStyle = g1;
        maskContext.beginPath();
        maskContext.arc(pointer.x, pointer.y, lensR, 0, Math.PI * 2);
        maskContext.fill();

        if (pointer.lx > -500) {
          const r2 = lensR * 0.85;
          const g2 = maskContext.createRadialGradient(pointer.lx, pointer.ly, 0, pointer.lx, pointer.ly, r2);
          g2.addColorStop(0, "rgba(255, 255, 255, 0.5)");
          g2.addColorStop(0.25, "rgba(255, 255, 255, 0.3)");
          g2.addColorStop(0.5, "rgba(255, 255, 255, 0.1)");
          g2.addColorStop(0.75, "rgba(255, 255, 255, 0.02)");
          g2.addColorStop(1, "rgba(255, 255, 255, 0)");
          maskContext.fillStyle = g2;
          maskContext.beginPath();
          maskContext.arc(pointer.lx, pointer.ly, r2, 0, Math.PI * 2);
          maskContext.fill();
        }

        if (pointer.l2x > -500) {
          const r3 = lensR * 0.70;
          const g3 = maskContext.createRadialGradient(pointer.l2x, pointer.l2y, 0, pointer.l2x, pointer.l2y, r3);
          g3.addColorStop(0, "rgba(255, 255, 255, 0.3)");
          g3.addColorStop(0.25, "rgba(255, 255, 255, 0.18)");
          g3.addColorStop(0.5, "rgba(255, 255, 255, 0.06)");
          g3.addColorStop(0.75, "rgba(255, 255, 255, 0.01)");
          g3.addColorStop(1, "rgba(255, 255, 255, 0)");
          maskContext.fillStyle = g3;
          maskContext.beginPath();
          maskContext.arc(pointer.l2x, pointer.l2y, r3, 0, Math.PI * 2);
          maskContext.fill();
        }
      }

      context!.drawImage(ascii, 0, 0, width, height);

      revealContext.fillStyle = "#0b0b0b";
      revealContext.fillRect(0, 0, width, height);
      revealContext.drawImage(photo, 0, 0, width, height);
      revealContext.globalCompositeOperation = "destination-in";
      revealContext.drawImage(mask, 0, 0, width, height);
      revealContext.globalCompositeOperation = "source-over";

      context!.drawImage(revealed, 0, 0, width, height);
    }

    function visibleAlpha(x: number, y: number) {
      if (x < 0 || y < 0 || x >= width || y >= height) return 0;
      const index = (Math.min(hitMap.height - 1, Math.floor(y / height * hitMap.height)) * hitMap.width + Math.min(hitMap.width - 1, Math.floor(x / width * hitMap.width))) * 4 + 3;
      const vertical = y / height;
      const fade = vertical <= 0.48 ? 1 : vertical < 0.6 ? 1 - (vertical - 0.48) / 0.12 * 0.1 : vertical < 0.78 ? 0.9 - (vertical - 0.6) / 0.18 * 0.52 : Math.max(0, 0.38 * (0.96 - vertical) / 0.18);
      const edge = Math.max(0, Math.min(1, x / width / 0.08, (1 - x / width) / 0.08));
      return (alphaPixels[index] ?? 0) / 255 * fade * edge;
    }

    function tick() {
      animFrame = 0;
      if (!prepared || disposed) return;
      pointer.lx += (pointer.x - pointer.lx) * 0.42;
      pointer.ly += (pointer.y - pointer.ly) * 0.42;
      pointer.l2x += (pointer.x - pointer.l2x) * 0.22;
      pointer.l2y += (pointer.y - pointer.l2y) * 0.22;

      draw();

      const dx1 = Math.abs(pointer.x - pointer.lx);
      const dy1 = Math.abs(pointer.y - pointer.ly);
      const dx2 = Math.abs(pointer.x - pointer.l2x);
      const dy2 = Math.abs(pointer.y - pointer.l2y);
      if (dx1 > 0.1 || dy1 > 0.1 || dx2 > 0.1 || dy2 > 0.1) {
        animFrame = requestAnimationFrame(tick);
      }
    }

    function clearPaint(immediate = false) {
      pointer.targetAct = 0;
      gsap.killTweensOf(pointer.act);
      if (immediate || pausedRef.current || preference.matches) {
        pointer.act.value = 0;
        if (animFrame) { cancelAnimationFrame(animFrame); animFrame = 0; }
        setPainted(false);
        draw();
        return;
      }
      gsap.to(pointer.act, {
        value: 0,
        duration: 0.55,
        ease: "power2.out",
        onUpdate: draw,
        onComplete: () => {
          if (disposed) return;
          if (animFrame) { cancelAnimationFrame(animFrame); animFrame = 0; }
          setPainted(false);
          draw();
        },
      });
    }

    function paint(clientX: number, clientY: number) {
      if (!prepared || disposed) return;
      const box = button!.getBoundingClientRect();
      const px = clientX - box.left;
      const py = clientY - box.top;
      if (visibleAlpha(px, py) < 0.16) {
        clearPaint();
        return;
      }
      pointer.x = px;
      pointer.y = py;
      if (pointer.targetAct === 0) {
        pointer.lx = px;
        pointer.ly = py;
        pointer.l2x = px;
        pointer.l2y = py;
        pointer.targetAct = 1;
        setPainted(true);
        gsap.killTweensOf(pointer.act);
        gsap.fromTo(
          pointer.act,
          { value: 0 },
          {
            value: 1,
            duration: preference.matches || pausedRef.current ? 0 : 0.08,
            ease: "power2.out",
            onUpdate: draw,
          },
        );
      } else {
        pointer.targetAct = 1;
        if (pointer.act.value < 1 && !gsap.isTweening(pointer.act)) {
          gsap.to(pointer.act, {
            value: 1,
            duration: preference.matches || pausedRef.current ? 0 : 0.08,
            ease: "power2.out",
            onUpdate: draw,
          });
        }
      }
      if (!animFrame) animFrame = requestAnimationFrame(tick);
    }

    let lastPrepW = 0;
    let lastPrepH = 0;
    let lastPrepRatio = 0;

    function prepare() {
      frame = 0;
      const art = artwork;
      if (disposed || !fontsReady || !art || !image!.complete || !image!.naturalWidth) return;
      const box = button!.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const nextRatio = Math.min(devicePixelRatio || 1, 2);
      if (
        prepared &&
        Math.abs(box.width - lastPrepW) < 0.5 &&
        Math.abs(box.height - lastPrepH) < 0.5 &&
        nextRatio === lastPrepRatio
      ) {
        return;
      }
      width = lastPrepW = box.width;
      height = lastPrepH = box.height;
      ratio = lastPrepRatio = nextRatio;
      for (const surface of [canvas!, photo, ascii, mask, revealed]) {
        surface.width = Math.round(width * ratio);
        surface.height = Math.round(height * ratio);
      }
      for (const ctx of [context!, photoContext, asciiContext, maskContext, revealContext]) ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const asciiRatio = Math.max(2, ratio);
      ascii.width = Math.round(width * asciiRatio);
      ascii.height = Math.round(height * asciiRatio);
      asciiContext.setTransform(asciiRatio, 0, 0, asciiRatio, 0, 0);
      photoContext.drawImage(image!, 0, 0, width, height);
      hitMap.width = Math.ceil(width);
      hitMap.height = Math.ceil(height);
      hitContext.drawImage(image!, 0, 0, hitMap.width, hitMap.height);
      alphaPixels = hitContext.getImageData(0, 0, hitMap.width, hitMap.height).data;
      const left: string[] = [];
      const right: string[] = [];
      const rowStep = Math.max(2, Math.floor(height / 150));
      for (let y = 0; y < height; y += rowStep) {
        let first = -1;
        let last = -1;
        for (let x = 0; x < width; x++) {
          if (visibleAlpha(x, y) < 0.16) continue;
          if (first < 0) first = x;
          last = x;
        }
        if (first < 0) continue;
        left.push(`${(first / width * 100).toFixed(2)}% ${(y / height * 100).toFixed(2)}%`);
        right.push(`${(last / width * 100).toFixed(2)}% ${(y / height * 100).toFixed(2)}%`);
      }
      hitArea!.style.clipPath = left.length ? `polygon(${[...left, ...right.reverse()].join(",")})` : "inset(100%)";
      pointer.act.value = 0;
      pointer.targetAct = 0;
      setPainted(false);

      const { source } = art;
      const { crop } = source;
      const cellWidth = width * source.width / crop.width / art.columns;
      const cellHeight = height * source.height / crop.height / art.rows;
      const offsetX = -width * crop.left / crop.width;
      const offsetY = -height * crop.top / crop.height;
      asciiContext.font = `600 ${cellHeight * 1.15}px ${fontFamily}`;
      asciiContext.textBaseline = "middle";
      asciiContext.textAlign = "left";
      asciiContext.fillStyle = "#f3f2ed";
      const m = asciiContext.measureText("M");
      const glyphH = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent || cellHeight * 0.72;
      const verticalScale = (cellHeight * 1.12) / glyphH;
      const horizontalScale = cellWidth / (m.width || 1);
      asciiContext.setTransform(asciiRatio * horizontalScale, 0, 0, asciiRatio * verticalScale, 0, 0);
      for (let row = 0; row < art.rows; row++) {
        const [column, text] = art.lines[row];
        const y = (offsetY + (row + 0.5) * cellHeight) / verticalScale;
        if (!text || y < -cellHeight || y > height / verticalScale + cellHeight) continue;
        asciiContext.fillText(text, (offsetX + column * cellWidth) / horizontalScale, y);
      }
      const tones = hitContext.createImageData(hitMap.width, hitMap.height);
      for (let index = 0; index < alphaPixels.length; index += 4) {
        const luminance = (alphaPixels[index] * 0.2126 + alphaPixels[index + 1] * 0.7152 + alphaPixels[index + 2] * 0.0722) / 255;
        const tone = 0.06 + 0.94 * Math.pow(Math.min(1, luminance / 0.72), 1.4);
        tones.data[index] = Math.round(243 * tone);
        tones.data[index + 1] = Math.round(242 * tone);
        tones.data[index + 2] = Math.round(237 * tone);
        tones.data[index + 3] = 255;
      }
      hitContext.putImageData(tones, 0, 0);
      asciiContext.setTransform(asciiRatio, 0, 0, asciiRatio, 0, 0);
      asciiContext.globalCompositeOperation = "source-in";
      asciiContext.drawImage(hitMap, 0, 0, width, height);
      asciiContext.globalCompositeOperation = "destination-in";
      asciiContext.drawImage(image!, 0, 0, width, height);
      asciiContext.globalCompositeOperation = "source-over";
      const silhouette = document.createElement("canvas");
      silhouette.width = width * asciiRatio;
      silhouette.height = height * asciiRatio;
      const silhouetteContext = silhouette.getContext("2d");
      if (silhouetteContext) {
        silhouetteContext.setTransform(asciiRatio, 0, 0, asciiRatio, 0, 0);
        silhouetteContext.fillStyle = "#0b0b0b";
        silhouetteContext.fillRect(0, 0, width, height);
        silhouetteContext.globalCompositeOperation = "destination-in";
        silhouetteContext.drawImage(image!, 0, 0, width, height);
        silhouetteContext.globalCompositeOperation = "source-over";
        asciiContext.setTransform(1, 0, 0, 1, 0, 0);
        asciiContext.globalCompositeOperation = "destination-over";
        asciiContext.drawImage(silhouette, 0, 0);
        asciiContext.globalCompositeOperation = "source-over";
      }
      prepared = true;
      setUnavailable(false);
      button!.dataset.ready = "true";
      draw();
    }

    function resize() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(prepare);
    }
    const observer = new ResizeObserver(resize);
    observer.observe(button);
    image.addEventListener("load", resize);
    image.addEventListener("error", fail);
    if (image.complete && !image.naturalWidth) fail();
    async function loadFont(art: AsciiArtwork) {
      const family = getComputedStyle(button!).fontFamily.split(",")[0].trim();
      const glyphs = [...new Set(art.lines.flatMap(([, text]) => [...text]))].join("");
      const font = `600 16px ${family}`;
      fontTimeout = window.setTimeout(fail, 15000);
      try {
        if (!/geist.?mono/i.test(family) || /fallback/i.test(family)) throw new Error("ASCII font family is unavailable");
        const faces = await document.fonts.load(font, glyphs);
        if (disposed) return;
        if (!faces.length || faces.some(face => face.status !== "loaded") || !document.fonts.check(font, glyphs)) throw new Error("ASCII font is unavailable");
        fontFamily = family;
        fontsReady = true;
        button!.dataset.asciiSource = "txt";
        resize();
      } catch {
        fail();
      } finally {
        window.clearTimeout(fontTimeout);
      }
    }
    const request = new AbortController();
    fetch("/portrait-ascii.json", { signal: request.signal })
      .then(response => {
        if (!response.ok) throw new Error("ASCII artwork is unavailable");
        return response.json() as Promise<AsciiArtwork>;
      })
      .then(data => {
        if (disposed) return;
        if (data.format !== "portrait-ascii-v1" || data.columns < 1 || data.rows !== data.lines.length || !data.source.crop.width || !data.source.crop.height) throw new Error("Invalid ASCII artwork");
        artwork = data;
        void loadFont(data);
        resize();
      })
      .catch(fail);
    drawRef.current = draw;
    paintRef.current = paint;
    clearPaintRef.current = clearPaint;
    resize();
    return () => {
      disposed = true;
      request.abort();
      window.clearTimeout(fontTimeout);
      cancelAnimationFrame(frame);
      if (animFrame) cancelAnimationFrame(animFrame);
      gsap.killTweensOf(pointer.act);
      observer.disconnect();
      image.removeEventListener("load", resize);
      image.removeEventListener("error", fail);
      drawRef.current = () => {};
      paintRef.current = () => {};
      clearPaintRef.current = () => {};
    };
  }, []);

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const state = progress.current;
    function animate() {
      gsap.killTweensOf(state);
      gsap.to(state, { value: latched ? 1 : 0, duration: paused || preference.matches ? 0 : latched ? 0.8 : 0.65, ease: "power2.inOut", onUpdate: () => drawRef.current() });
    }
    preference.addEventListener("change", animate);
    animate();
    return () => { preference.removeEventListener("change", animate); gsap.killTweensOf(state); };
  }, [latched, paused]);

  return <div className="hero-portrait">
    <button ref={buttonRef} type="button" className="portrait-button" aria-label={label} aria-pressed={latched} aria-describedby="portrait-help" data-ready="false" data-mode={latched ? "photo" : painted ? "paint" : "ascii"}
      onPointerEnter={event => {
        if (event.pointerType === "touch") return;
        paintRef.current(event.clientX, event.clientY);
      }}
      onPointerMove={event => {
        if (event.pointerType !== "touch") paintRef.current(event.clientX, event.clientY);
      }}
      onPointerDown={event => { pointerType.current = event.pointerType; }}
      onPointerLeave={() => clearPaintRef.current()}
      onClick={event => {
        if (event.detail === 0 || pointerType.current === "touch") setLatched(value => !value);
        else paintRef.current(event.clientX, event.clientY);
      }}
      onBlur={() => { setLatched(false); clearPaintRef.current(); }}
      onKeyDown={event => { if (event.key === "Escape") { setLatched(false); clearPaintRef.current(true); } }}>
      <picture>
        <source type="image/avif" srcSet="/portrait-hero-640.avif 640w, /portrait-hero.avif 1280w" sizes={imageSizes} />
        <source type="image/webp" srcSet="/portrait-hero-640.webp 640w, /portrait-hero.webp 1280w" sizes={imageSizes} />
        <Image ref={imageRef} src="/portrait-hero.webp" alt={alt} fill unoptimized loading="eager" fetchPriority="high" sizes={imageSizes} />
      </picture>
      <canvas ref={canvasRef} aria-hidden="true" />
      <span ref={hitAreaRef} className="portrait-hit-area" aria-hidden="true" />
    </button>
    {unavailable ? <p className="portrait-unavailable" role="status">{alt.startsWith("Potret ") ? "Potret tidak tersedia" : "Portrait unavailable"}</p> : null}
    <p className="sr-only" id="portrait-help">{hint}</p>
  </div>;
}
