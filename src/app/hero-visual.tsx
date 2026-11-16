"use client";

import { useEffect, useRef } from "react";
import { fragmentShader, vertexShader } from "./hero-shader";

export default function HeroVisual({ paused = false, variant = "hero" }: { paused?: boolean; variant?: "hero" | "band" }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const syncRef = useRef<() => void>(() => {});

  useEffect(() => {
    pausedRef.current = paused;
    syncRef.current();
  }, [paused]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    const parent = wrapper?.parentElement;
    if (!wrapper || !canvas || !parent) return;
    const targetWrapper = wrapper;
    const targetCanvas = canvas;
    const targetParent = parent;

    function initWebGL() {
      const gl = targetCanvas.getContext("webgl", { alpha: false, antialias: false, depth: false, preserveDrawingBuffer: true });
      if (!gl) return () => {};

      const motion = matchMedia("(prefers-reduced-motion: reduce)");
      let program: WebGLProgram | null = null;
      let buffer: WebGLBuffer | null = null;
      let shaders: WebGLShader[] = [];
      let uniforms: Record<string, WebGLUniformLocation | null> = {};
      let frame = 0;
      let previous = 0;
      let elapsed = 0;
      let visible = true;
      let lost = false;
      let width = 0;
      let height = 0;
      let x = 0;
      let y = 0;
      let targetX = 0;
      let targetY = 0;

      function setup() {
        program = gl!.createProgram();
        if (!program) return false;
        shaders = [];
        for (const [type, source] of [[gl!.VERTEX_SHADER, vertexShader], [gl!.FRAGMENT_SHADER, fragmentShader]] as const) {
          const shader = gl!.createShader(type);
          if (!shader) return false;
          shaders.push(shader);
          gl!.shaderSource(shader, source);
          gl!.compileShader(shader);
          if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) return false;
          gl!.attachShader(program, shader);
        }
        gl!.linkProgram(program);
        if (!gl!.getProgramParameter(program, gl!.LINK_STATUS)) return false;
        gl!.useProgram(program);
        buffer = gl!.createBuffer();
        gl!.bindBuffer(gl!.ARRAY_BUFFER, buffer);
        gl!.bufferData(gl!.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl!.STATIC_DRAW);
        const position = gl!.getAttribLocation(program, "position");
        gl!.enableVertexAttribArray(position);
        gl!.vertexAttribPointer(position, 2, gl!.FLOAT, false, 0, 0);
        uniforms = Object.fromEntries(["resolution", "pointer", "time", "mobile", "band", "scrollFade"].map(name => [name, gl!.getUniformLocation(program!, name)]));
        return true;
      }

      function draw() {
        if (!width || !height || lost) return;
        gl!.uniform2f(uniforms.resolution, targetCanvas.width, targetCanvas.height);
        gl!.uniform2f(uniforms.pointer, x, -y);
        gl!.uniform1f(uniforms.time, elapsed);
        gl!.uniform1f(uniforms.mobile, width < 900 ? 1 : 0);
        gl!.uniform1f(uniforms.band, variant === "band" ? 1 : 0);
        gl!.uniform1f(uniforms.scrollFade, variant === "hero" ? Math.min(1, Math.max(0, (typeof window !== "undefined" ? window.scrollY : 0) / height)) : 0);
        gl!.drawArrays(gl!.TRIANGLES, 0, 3);
        targetWrapper.dataset.ready = "true";
      }

      function running() {
        return variant !== "band" && visible && !document.hidden && !motion.matches && !pausedRef.current && !lost;
      }

      function tick(now: number) {
        frame = 0;
        if (!running()) return;
        if (!previous || now - previous >= 1000 / 30) {
          const delta = previous ? Math.min(0.08, (now - previous) / 1000) : 0;
          elapsed += delta;
          x += (targetX - x) * 0.08;
          y += (targetY - y) * 0.08;
          previous = now;
          draw();
        }
        frame = requestAnimationFrame(tick);
      }

      function sync() {
        cancelAnimationFrame(frame);
        previous = 0;
        if (!visible || document.hidden || lost) return;
        draw();
        if (running()) frame = requestAnimationFrame(tick);
      }

      function resize() {
        const box = targetWrapper.getBoundingClientRect();
        if (Math.abs(box.width - width) < 0.5 && Math.abs(box.height - height) < 0.5 && width > 0) return;
        width = box.width;
        height = box.height;
        const step = variant === "band" ? 1 : 4;
        targetCanvas.width = Math.max(1, Math.ceil(width / step));
        targetCanvas.height = Math.max(1, Math.ceil(height / step));
        gl!.viewport(0, 0, targetCanvas.width, targetCanvas.height);
        sync();
      }

      function move(event: PointerEvent) {
        if (!running() || event.pointerType === "touch" || variant === "band") return;
        const box = targetParent.getBoundingClientRect();
        targetX = (event.clientX - box.left) / box.width * 2 - 1;
        targetY = (event.clientY - box.top) / box.height * 2 - 1;
      }
      function leave() { targetX = 0; targetY = 0; }
      function onLost(event: Event) {
        event.preventDefault();
        lost = true;
        cancelAnimationFrame(frame);
        targetWrapper.dataset.ready = "false";
      }
      function onRestored() {
        width = 0;
        height = 0;
        lost = !setup();
        if (!lost) resize();
      }

      if (!setup()) {
        shaders.forEach(shader => gl.deleteShader(shader));
        gl.deleteProgram(program);
        return () => {};
      }
      syncRef.current = sync;
      const resizeObserver = new ResizeObserver(resize);
      const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
      resizeObserver.observe(targetWrapper);
      observer.observe(targetWrapper);
      targetParent.addEventListener("pointermove", move, { passive: true });
      targetParent.addEventListener("pointerleave", leave);
      document.addEventListener("visibilitychange", sync);
      motion.addEventListener("change", sync);
      targetCanvas.addEventListener("webglcontextlost", onLost);
      targetCanvas.addEventListener("webglcontextrestored", onRestored);
      resize();

      return () => {
        cancelAnimationFrame(frame);
        syncRef.current = () => {};
        observer.disconnect();
        resizeObserver.disconnect();
        targetParent.removeEventListener("pointermove", move);
        targetParent.removeEventListener("pointerleave", leave);
        document.removeEventListener("visibilitychange", sync);
        motion.removeEventListener("change", sync);
        targetCanvas.removeEventListener("webglcontextlost", onLost);
        targetCanvas.removeEventListener("webglcontextrestored", onRestored);
        gl.deleteBuffer(buffer);
        shaders.forEach(shader => gl.deleteShader(shader));
        gl.deleteProgram(program);
      };
    }

    let initialized = false;
    let cleanup: (() => void) | null = null;

    function start() {
      if (initialized) return;
      initialized = true;
      window.removeEventListener("portfolio:preloader-done", start);
      cleanup = initWebGL();
    }

    const shell = document.querySelector(".portfolio-shell");
    let timer = 0;
    if (shell?.getAttribute("data-preloader") === "active") {
      window.addEventListener("portfolio:preloader-done", start, { once: true });
    } else {
      timer = window.setTimeout(start, 120);
    }

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("portfolio:preloader-done", start);
      cleanup?.();
    };
  }, [variant]);

  return <div ref={wrapperRef} className={`hero-visual visual-${variant}`} aria-hidden="true" data-ready="false">
    <span className="visual-fallback" />
    <canvas ref={canvasRef} aria-hidden="true" />
  </div>;
}
