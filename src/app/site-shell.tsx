"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import SiteHeader from "./site-header";
import PointerCursor from "./pointer-cursor";
import FooterSection from "./footer-section";
import { useLocale } from "./locale-provider";
import { motionTokens, primeGsapElements } from "./motion-tokens";

gsap.registerPlugin(CustomEase);
const preloaderCharEase = CustomEase.create("preloader-char-ease", "0.22, 1, 0.36, 1");
const preloaderExitEase = CustomEase.create("preloader-exit-ease", motionTokens.ease.curtain);
let initialReloadHandled = false;

function ParticlesPreloader({
  onReveal,
  onComplete,
}: {
  onReveal: () => void;
  onComplete: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const onRevealRef = useRef(onReveal);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onRevealRef.current = onReveal;
    onCompleteRef.current = onComplete;
  }, [onReveal, onComplete]);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const logo = logoRef.current;
    if (!root || !canvas || !logo || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onRevealRef.current();
      onCompleteRef.current();
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      onRevealRef.current();
      onCompleteRef.current();
      return;
    }

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = window.innerWidth;
    let height = window.innerHeight;
    let sized = false;
    const resizeCanvas = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sized = true;
    };

    const pointer = { x: width / 2, y: height / 2 };
    const intensity = 1.2;
    const color = "#f3f2ed";
    const particleCount = width < 900 ? 36 : 64;
    const particles = Array.from({ length: particleCount }, () => ({
      x: width / 2 + (Math.random() - 0.5) * width * 0.75,
      y: height / 2 + (Math.random() - 0.5) * height * 0.75,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      seed: Math.random() * 1000,
    }));
    let u = 0;
    let rafId = 0;
    let lastTime = performance.now();

    const onMove = (event: MouseEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    };

    const draw = (now: number) => {
      if (!sized) {
        resizeCanvas();
        ctx.fillStyle = "#0b0b0b";
        ctx.fillRect(0, 0, width, height);
      }
      const dt = Math.min(Math.max((now - lastTime) / 16.6667, 0.5), 2.5);
      lastTime = now;
      u += 0.006 * dt;
      ctx.fillStyle = "rgba(11, 11, 11, 0.92)";
      ctx.fillRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;
      const damping = Math.pow(0.94, dt);
      for (const p of particles) {
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const distPointer = Math.sqrt(dx * dx + dy * dy);
        const px = p.x - cx;
        const py = p.y - cy;
        const pull = 0.0008 * intensity * dt;
        const repel = Math.max(0, 1 - distPointer / 120);
        p.vx += -px * pull + dx * repel * 0.002 * intensity * dt;
        p.vy += -py * pull + dy * repel * 0.002 * intensity * dt;
        const wave = Math.sin(u + p.seed) * 0.15 * dt;
        p.vx = (p.vx + wave) * damping;
        p.vy = (p.vy - wave) * damping;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
        const distCenter = Math.sqrt(px * px + py * py);
        const v = Math.max(0, 1 - distCenter / 400);
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.15 + v * 0.65;
        ctx.arc(p.x, p.y, 1.6 + v * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("resize", resizeCanvas);

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(watchdog);
      onRevealRef.current();
      onCompleteRef.current();
    };

    const watchdog = setTimeout(finish, 4350);

    const onVisibility = () => {
      if (document.hidden) {
        finish();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const chars = logo.querySelectorAll<HTMLElement>(".site-preloader-char");
    primeGsapElements([root, logo, ...chars], { opacity: true });
    gsap.set(root, { yPercent: 0 });
    const tl = gsap.timeline({
      onComplete: finish,
    });
    tl.fromTo(
      logo,
      { borderColor: "rgba(243, 242, 237, 0)", backgroundColor: "rgba(11, 11, 11, 0)" },
      { borderColor: "rgba(243, 242, 237, 0.85)", backgroundColor: "rgba(11, 11, 11, 0.45)", duration: 1.1, ease: preloaderCharEase },
      0.15,
    )
      .fromTo(
        chars,
        { yPercent: 60, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 1.1, stagger: 0.18, ease: preloaderCharEase },
        0.15,
      )
      .call(() => {
        onRevealRef.current();
      }, [], 3.0)
      .fromTo(
        root,
        { yPercent: 0 },
        { yPercent: -100, duration: 1.25, ease: preloaderExitEase },
        2.8,
      );

    return () => {
      clearTimeout(watchdog);
      document.removeEventListener("visibilitychange", onVisibility);
      tl.kill();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div ref={rootRef} className="site-preloader" aria-hidden="true">
      <canvas ref={canvasRef} className="site-preloader-canvas" />
      <div className="site-preloader-grid" />
      <div ref={logoRef} className="site-preloader-logo">
        {["M", "D", "."].map(char => (
          <span key={char} className="site-preloader-char">
            {char}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SiteShell({ children }: { children: ReactNode }) {
  const { locale } = useLocale();
  const pathname = usePathname();
  const [heroReleased, setHeroReleased] = useState(() => pathname !== "/");
  const [preloaderDone, setPreloaderDone] = useState(() => pathname !== "/");
  const showPreloader = pathname === "/" && !preloaderDone;
  const holdHero = pathname === "/" && !heroReleased;

  useEffect(() => {
    if (!showPreloader) return;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlTouch = document.documentElement.style.touchAction;
    const prevBodyTouch = document.body.style.touchAction;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.documentElement.style.touchAction = "none";
    document.body.style.touchAction = "none";
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.touchAction = prevHtmlTouch;
      document.body.style.touchAction = prevBodyTouch;
      requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent("portfolio:preloader-settled"));
      });
    };
  }, [showPreloader]);

  useEffect(() => {
    if (pathname !== "/" && (!preloaderDone || !heroReleased)) {
      const id = requestAnimationFrame(() => {
        setHeroReleased(true);
        setPreloaderDone(true);
      });
      return () => cancelAnimationFrame(id);
    }
  }, [pathname, preloaderDone, heroReleased]);

  useEffect(() => {
    if (typeof history !== "undefined" && "scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    if (initialReloadHandled) return;
    initialReloadHandled = true;
    const navEntry = typeof performance !== "undefined"
      ? (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)
      : undefined;
    if (navEntry?.type === "reload") {
      window.__portfolioTargetHash = "";
      if (window.location.hash) {
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }
      window.scrollTo({ top: 0, behavior: "instant" });
      window.dispatchEvent(new CustomEvent("portfolio:navigate", { detail: 0 }));
    }
  }, []);

  function handlePreloaderReveal() {
    setHeroReleased(current => {
      if (!current) {
        window.dispatchEvent(new CustomEvent("portfolio:preloader-done"));
      }
      return true;
    });
  }

  function handlePreloaderComplete() {
    handlePreloaderReveal();
    setPreloaderDone(true);
  }

  return (
    <div className="portfolio-shell" data-motion="on" data-preloader={holdHero ? "active" : "done"}>
      {showPreloader && (
        <ParticlesPreloader
          onReveal={handlePreloaderReveal}
          onComplete={handlePreloaderComplete}
        />
      )}
      <SiteHeader />
      {children}
      <FooterSection locale={locale} paused={false} />
      <PointerCursor />
    </div>
  );
}
