"use client";

import { createContext, useContext, useRef, type ReactNode } from "react";
import { router } from "@inertiajs/react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { motionTokens } from "./motion-tokens";

gsap.registerPlugin(CustomEase);
const curtainEase = CustomEase.create("global-curtain-ease", motionTokens.ease.curtain);
const curtainCharEase = CustomEase.create("global-curtain-char-ease", "0.22, 1, 0.36, 1");

const MAX_WAIT_MS = 8000;

type TransitionContextType = {
  navigateWithCurtain: (url: string, direction?: "up" | "down") => void;
};

declare global {
  interface Window {
    __portfolioTargetHash?: string;
  }
}

const TransitionContext = createContext<TransitionContextType>({
  navigateWithCurtain: () => {},
});

export function usePageTransition() {
  return useContext(TransitionContext);
}

function waitForDestinationReady(): Promise<void> {
  return new Promise<void>(resolve => {
    const timeout = setTimeout(resolve, MAX_WAIT_MS);
    const done = () => { clearTimeout(timeout); resolve(); };

    const check = async () => {
      try {
        await document.fonts.ready;
      } catch {}

      const imgs = document.querySelectorAll<HTMLImageElement>("img");
      const visible: HTMLImageElement[] = [];
      for (const img of imgs) {
        if (img.complete) continue;
        const rect = img.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth) {
          visible.push(img);
        }
      }

      if (visible.length === 0) { done(); return; }

      let remaining = visible.length;
      const onLoad = () => { if (--remaining <= 0) done(); };
      for (const img of visible) {
        img.addEventListener("load", onLoad, { once: true });
        img.addEventListener("error", onLoad, { once: true });
      }
    };

    requestAnimationFrame(() => requestAnimationFrame(check));
  });
}

function stripHash(url: string): string {
  const i = url.indexOf("#");
  return i >= 0 ? url.slice(0, i) : url;
}

function currentPathname(): string {
  return window.location.pathname + window.location.search;
}

export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const curtainRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const lastNavTime = useRef(0);
  const activeNav = useRef(0);

  function openCurtain(bar: HTMLElement, direction: "up" | "down") {
    const inset = direction === "up" ? "inset(0% 0% 100% 0%)" : "inset(100% 0% 0% 0%)";
    gsap.to(bar, {
      clipPath: inset,
      duration: 0.75,
      ease: curtainEase,
      onComplete: () => { bar.style.display = "none"; },
    });
  }

  function navigateWithCurtain(url: string, direction: "up" | "down" = "up") {
    const now = Date.now();
    if (now - lastNavTime.current < 500) return;
    lastNavTime.current = now;

    if (typeof window !== "undefined") {
      const hashIdx = url.indexOf("#");
      window.__portfolioTargetHash = hashIdx >= 0 ? url.slice(hashIdx) : "";
    }

    const reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !curtainRef.current) {
      router.visit(url);
      return;
    }

    const isSameRoute = stripHash(url) === currentPathname();
    if (isSameRoute) {
      if (url.includes("#")) {
        const el = document.querySelector(url.slice(url.indexOf("#")));
        el?.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }

    const navId = ++activeNav.current;
    const bar = curtainRef.current;
    const logo = logoRef.current;
    bar.style.display = "flex";

    if (logo) {
      const chars = logo.querySelectorAll<HTMLElement>(".global-curtain-char");
      gsap.killTweensOf([logo, chars]);
      gsap.fromTo(
        logo,
        { borderColor: "rgba(243, 242, 237, 0)", backgroundColor: "rgba(11, 11, 11, 0)" },
        { borderColor: "rgba(243, 242, 237, 0.85)", backgroundColor: "rgba(11, 11, 11, 0.45)", duration: 0.55, delay: 0.12, ease: curtainCharEase },
      );
      gsap.fromTo(
        chars,
        { yPercent: 60, opacity: 0, filter: "blur(10px)" },
        { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 0.55, stagger: 0.08, delay: 0.12, ease: curtainCharEase },
      );
    }

    const closeIn = direction === "up" ? "inset(100% 0% 0% 0%)" : "inset(0% 0% 100% 0%)";
    const closeFull = "inset(0% 0% 0% 0%)";

    gsap.fromTo(bar, { clipPath: closeIn }, {
      clipPath: closeFull,
      duration: 0.75,
      ease: curtainEase,
      onComplete: () => {
        if (navId !== activeNav.current) return;
        const safetyTimer = setTimeout(() => {
          if (navId !== activeNav.current) return;
          openCurtain(bar, direction);
        }, MAX_WAIT_MS);

        router.visit(url, {
          preserveScroll: false,
          onSuccess: async () => {
            if (navId !== activeNav.current) { clearTimeout(safetyTimer); return; }
            await waitForDestinationReady();
            clearTimeout(safetyTimer);
            if (navId !== activeNav.current) return;
            openCurtain(bar, direction);
          },
          onError: () => {
            clearTimeout(safetyTimer);
            if (navId !== activeNav.current) return;
            openCurtain(bar, direction);
          },
          onCancel: () => {
            clearTimeout(safetyTimer);
            if (navId !== activeNav.current) return;
            openCurtain(bar, direction);
          },
        });
      },
    });
  }

  return (
    <TransitionContext.Provider value={{ navigateWithCurtain }}>
      {children}
      <div ref={curtainRef} className="global-curtain" aria-hidden="true">
        <div ref={logoRef} className="site-preloader-logo global-curtain-logo">
          {["M", "D", "."].map(char => (
            <span key={char} className="site-preloader-char global-curtain-char">
              {char}
            </span>
          ))}
        </div>
      </div>
    </TransitionContext.Provider>
  );
}
