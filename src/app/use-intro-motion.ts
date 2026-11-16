"use client";

import { useEffect, useRef, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import type { Locale } from "./intro-content";
import { motionTokens, observeViewportReveal, primeGsapElements, scheduleMotionInit } from "./motion-tokens";

gsap.registerPlugin(ScrollTrigger);

export function useIntroMotion(root: RefObject<HTMLDivElement | null>, locale: Locale, paused: boolean) {
  const lenisRef = useRef<Lenis | null>(null);
  const pausedRef = useRef(paused);

  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useEffect(() => {
    if (!root.current || paused) return;
    const host = root.current;
    const media = gsap.matchMedia(host);
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const heroSection = host.querySelector("#introduction") ?? host;
      const timeline = gsap.timeline({ paused: true, defaults: { ease: "power2.out" } });
      let entranceComplete = false; 
      timeline.eventCallback("onComplete", () => { entranceComplete = true; });
      host.dataset.heroEntrance = "active";
      timeline.eventCallback("onComplete", () => { entranceComplete = true; host.dataset.heroEntrance = "done"; });
      void entranceComplete; 
      const heroChars = host.querySelectorAll<HTMLElement>(".hero-character");
      const heroSummaries = host.querySelectorAll<HTMLElement>(".hero-summary");
      const isMobile = typeof window !== "undefined" && window.innerWidth < 900;
      primeGsapElements(heroChars, { opacity: true, filter: !isMobile });
      primeGsapElements(heroSummaries, { opacity: true });
      timeline.from(heroChars, {
        opacity: 0,
        y: 28,
        scale: 0.94,
        ...(isMobile ? {} : { filter: "blur(14px)" }),
        duration: 1.8,
        immediateRender: true,
        stagger: 0.028,
        ease: "power3.out",
        clearProps: isMobile ? "transform,opacity" : "transform,opacity,filter",
      }, 0.05)
        .from(heroSummaries, { opacity: 0, y: 18, duration: motionTokens.duration.contentReveal, clearProps: "transform,opacity" }, 0.35);

      const shell = document.querySelector(".portfolio-shell");
      if (shell?.getAttribute("data-preloader") === "active") {
        timeline.pause();
        const playEntrance = () => { timeline.play(); };
        window.addEventListener("portfolio:preloader-done", playEntrance, { once: true });
        return () => window.removeEventListener("portfolio:preloader-done", playEntrance);
      }
      return observeViewportReveal(heroSection, () => { timeline.play(); });
    });
    media.add("(min-width: 900px) and (prefers-reduced-motion: no-preference)", () => {
      const heroSection = host.querySelector("#introduction") ?? host;
      const metaChars = host.querySelectorAll<HTMLElement>(".metadata-character, .metadata-line time");
      const heroPromos = host.querySelectorAll<HTMLElement>(".hero-promo");
      primeGsapElements(heroPromos, { opacity: true });
      primeGsapElements(metaChars);

      const metaTimeline = gsap.timeline({ paused: true, defaults: { ease: "power2.out" } });
      metaTimeline
        .from(metaChars, { yPercent: 115, duration: motionTokens.duration.characterReveal, stagger: { amount: motionTokens.stagger.characterAmount }, clearProps: "transform" }, 0.1)
        .from(heroPromos, { opacity: 0, duration: 1.4, clearProps: "opacity" }, 0.2);

      const shell = document.querySelector(".portfolio-shell");
      if (shell?.getAttribute("data-preloader") === "active") {
        metaTimeline.pause();
        const playEntrance = () => { metaTimeline.play(); };
        window.addEventListener("portfolio:preloader-done", playEntrance, { once: true });
        return () => window.removeEventListener("portfolio:preloader-done", playEntrance);
      }
      return observeViewportReveal(heroSection, () => { metaTimeline.play(); });
    });
    media.add("(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      const letters = [...host.querySelectorAll<HTMLElement>(".hero-character")].map(element => ({
        element,
        weight: 250,
        scaleY: 1,
        scaleX: 1,
      }));
      let pointerX = Infinity;
      let pointerY = Infinity;
      let needsUpdate = false;
      function updateWeights() {
        if (pausedRef.current || document.hidden || host.dataset.heroEntrance !== "done" || !needsUpdate) return;
        const activeHover = isFinite(pointerX) && isFinite(pointerY);
        if (!activeHover) {
          let allRest = true;
          for (const letter of letters) {
            if (Math.round(letter.weight) !== 250 || letter.scaleX !== 1 || letter.scaleY !== 1) { allRest = false; break; }
          }
          if (allRest) { needsUpdate = false; return; }
        }
        const boxes = letters.map(({ element }) => element.getBoundingClientRect());
        let hasActive = false;
        letters.forEach((letter, index) => {
          const box = boxes[index];
          const distance = activeHover
            ? Math.hypot(box.x + box.width / 2 - pointerX, box.y + box.height / 2 - pointerY)
            : Infinity;
          const influence = Math.max(0, 1 - distance / 320);
          const smooth = influence * influence * (3 - 2 * influence);
          const targetWeight = 250 + smooth * 650;
          const targetScaleY = 1 + smooth * 0.16;
          const targetScaleX = 1 + smooth * 0.08;

          letter.weight += (targetWeight - letter.weight) * 0.14;
          letter.scaleY += (targetScaleY - letter.scaleY) * 0.14;
          letter.scaleX += (targetScaleX - letter.scaleX) * 0.14;

          const rounded = Math.round(letter.weight);
          const scaleX = letter.scaleX.toFixed(3);
          const scaleY = letter.scaleY.toFixed(3);
          const atRest = rounded === 250 && scaleX === "1.000" && scaleY === "1.000";
          if (!atRest) hasActive = true;
          if (!activeHover && atRest) {
            letter.weight = 250;
            letter.scaleX = 1;
            letter.scaleY = 1;
          }

          letter.element.style.fontWeight = String(rounded);
          letter.element.style.fontVariationSettings = `'wght' ${rounded}`;
          if (!atRest || activeHover) {
            letter.element.style.transform = `scale(${scaleX}, ${scaleY})`;
            letter.element.style.transformOrigin = "center bottom";
          } else {
            letter.element.style.removeProperty("transform");
            letter.element.style.removeProperty("transform-origin");
          }
        });
        if (!activeHover && !hasActive) needsUpdate = false;
      }
      gsap.ticker.add(updateWeights);
      function move(event: PointerEvent) {
        if (pausedRef.current || event.pointerType === "touch") return;
        pointerX = event.clientX;
        pointerY = event.clientY;
        needsUpdate = true;
      }
      function leave() {
        pointerX = Infinity;
        pointerY = Infinity;
      }
      host.addEventListener("pointermove", move, { passive: true });
      host.addEventListener("pointerleave", leave);
      host.addEventListener("keydown", leave);
      return () => {
        gsap.ticker.remove(updateWeights);
        letters.forEach(({ element }) => {
          element.style.removeProperty("font-weight");
          element.style.removeProperty("font-variation-settings");
          element.style.removeProperty("transform");
          element.style.removeProperty("transform-origin");
        });
        host.removeEventListener("pointermove", move);
        host.removeEventListener("pointerleave", leave);
        host.removeEventListener("keydown", leave);
      };
    });
    return () => media.revert();
  }, [root, locale, paused]);

  useEffect(() => {
    const host = root.current;
    const aboutSection = host?.querySelector<HTMLElement>("#about");
    if (!host || !aboutSection || paused) return;
    return scheduleMotionInit(() => {
      const media = gsap.matchMedia(aboutSection);
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const cleanups: (() => void)[] = [];
        const aboutChars = aboutSection.querySelectorAll<HTMLElement>(".about-char");
        const aboutWords = aboutSection.querySelectorAll<HTMLElement>(".about-word");
        const aboutReveals = aboutSection.querySelectorAll<HTMLElement>(".about-reveal");
        const reveals = [...aboutReveals, ...host.querySelectorAll<HTMLElement>(".manifesto-caption, .about-eyebrow, .about-disclosure-button")];

        const isMob = typeof window !== "undefined" && window.innerWidth < 900;
        primeGsapElements(aboutChars, { opacity: true, filter: !isMob });
        primeGsapElements(reveals, { opacity: true });

        if (aboutChars.length) {
          const charTween = gsap.from(aboutChars, {
            opacity: 0,
            y: 28,
            scale: 0.94,
            ...(isMob ? {} : { filter: "blur(14px)" }),
            duration: 1.8,
            stagger: 0.028,
            ease: "power3.out",
            paused: true,
            clearProps: isMob ? "transform,opacity" : "transform,opacity,filter",
          });
          cleanups.push(observeViewportReveal(aboutSection, () => { charTween.play(); }));
        }

        if (aboutWords.length) {
          const lastWordStates = new Float32Array(aboutWords.length).fill(-1);
          const isMob = typeof window !== "undefined" && window.innerWidth < 900;
          const applyWordColors = (progress: number) => {
            const count = aboutWords.length;
            const softness = 3;
            aboutWords.forEach((word, index) => {
              const r = progress * (count + softness);
              const rawProgress = gsap.utils.clamp(0, 1, (r - index) / softness);
              if (Math.abs(rawProgress - lastWordStates[index]) < 0.005) return;
              lastWordStates[index] = rawProgress;
              if (rawProgress >= 1) {
                word.style.color = "rgb(243, 242, 237)";
                if (!isMob) word.style.filter = "none";
                word.style.opacity = "1";
                return;
              }
              if (rawProgress <= 0) {
                word.style.color = "rgb(85, 85, 82)";
                if (!isMob) word.style.filter = "blur(14px)";
                word.style.opacity = "0.18";
                return;
              }
              const wordProgress = 1 - Math.pow(1 - rawProgress, 3);
              const red = Math.round(85 + (243 - 85) * wordProgress);
              const green = Math.round(85 + (242 - 85) * wordProgress);
              const blue = Math.round(82 + (237 - 82) * wordProgress);
              const opacity = (0.18 + 0.82 * wordProgress).toFixed(3);
              word.style.color = `rgb(${red}, ${green}, ${blue})`;
              word.style.opacity = opacity;
              if (!isMob) {
                const blurVal = 14 * (1 - wordProgress);
                word.style.filter = blurVal <= 0.4 ? "none" : `blur(${blurVal.toFixed(1)}px)`;
              }
            });
          };
          const leadElement = aboutSection.querySelector(".about-lead");
          const wordTrigger = ScrollTrigger.create({
            trigger: leadElement,
            start: "top 85%",
            end: "top 42%",
            scrub: 0.35,
            onUpdate: self => applyWordColors(self.progress),
          });
          applyWordColors(wordTrigger.progress);
          cleanups.push(() => {
            wordTrigger.kill();
            aboutWords.forEach(w => {
              w.style.color = "";
              w.style.filter = "";
              w.style.opacity = "";
            });
          });
        }

        reveals.forEach(element => {
          const revealTween = gsap.from(element, {
            opacity: 0,
            y: 40,
            duration: motionTokens.duration.contentReveal,
            ease: motionTokens.ease.power2Out,
            paused: true,
            clearProps: "transform,opacity",
          });
          cleanups.push(observeViewportReveal(element, () => { revealTween.play(); }));
        });

        return () => cleanups.forEach(fn => fn());
      });
      return () => media.revert();
    }, 24);
  }, [root, paused, locale]);

  useEffect(() => {
    const host = root.current;
    const track = host?.querySelector<HTMLElement>(".ticker-track");
    const band = host?.querySelector<HTMLElement>(".manifesto");
    if (!host || !track || !band) return;
    return scheduleMotionInit(() => {
      const preference = matchMedia("(prefers-reduced-motion: reduce)");
      primeGsapElements([track]);
      const setX = gsap.quickSetter(track, "x", "px");
      const setSkew = gsap.quickSetter(track, "skewX", "deg");
      let active = false;
      let offset = 0;
      let skew = 0;
      let lastAppliedSkew = 0;
      let wheelSkew = 0;
      let direction = 1;
      let previousY = scrollY;
      let groupWidth = 0;
      const visibility = ScrollTrigger.create({ trigger: band, start: "top bottom", end: "bottom top", onToggle: self => { active = self.isActive; } });
      const updateGroupWidth = () => {
        const firstGroup = track.querySelector<HTMLElement>(".ticker-group");
        groupWidth = firstGroup ? firstGroup.offsetWidth : track.scrollWidth / 2;
      };
      updateGroupWidth();
      if (typeof document !== "undefined" && document.fonts) {
        document.fonts.ready.then(updateGroupWidth);
      }
      const resize = new ResizeObserver(() => {
        const prev = groupWidth;
        updateGroupWidth();
        if (prev > 0 && Math.abs(groupWidth - prev) > 8) {
          ScrollTrigger.refresh();
        }
      });
      resize.observe(band);

      function onWheel(event: WheelEvent) {
        if (paused || preference.matches) return;
        const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
        if (Math.abs(pixels) < 1) return;
        direction = pixels > 0 ? 1 : -1;
        wheelSkew = gsap.utils.clamp(-14, 14, pixels * 0.04);
      }

      function tick(time: number) {
        lenisRef.current?.raf(time * 1000);
        const delta = scrollY - previousY;
        previousY = scrollY;
        if (!active || document.hidden || !groupWidth) return;
        if (Math.abs(delta) > 0.2) direction = delta > 0 ? 1 : -1;
        const isMob = window.innerWidth < 900;
        if (!isMob) {
          const scrollSkew = gsap.utils.clamp(-14, 14, delta * 0.8);
          const targetSkew = Math.abs(wheelSkew) > Math.abs(scrollSkew) ? wheelSkew : scrollSkew;
          skew += (targetSkew - skew) * 0.3;
          wheelSkew *= 0.94;
          if (Math.abs(skew) < 0.05 && Math.abs(targetSkew) < 0.05) skew = 0;
          if (Math.abs(skew - lastAppliedSkew) > 0.04) {
            lastAppliedSkew = skew;
            setSkew(skew);
          }
        }
        offset += direction * (0.4 + Math.abs(delta) * 0.35);
        offset = (offset % groupWidth + groupWidth) % groupWidth;
        setX(-offset);
      }

      function sync() {
        gsap.ticker.remove(tick);
        lenisRef.current?.destroy();
        lenisRef.current = null;
        previousY = scrollY;
        skew = 0;
        lastAppliedSkew = 0;
        wheelSkew = 0;
        if (preference.matches) { setX(0); setSkew(0); return; }
        if (paused) { setSkew(0); return; }
        const lenis = new Lenis({ autoRaf: false, lerp: 0.1, smoothWheel: true, syncTouch: false, anchors: false, prevent: element => Boolean(element.closest("dialog")) });
        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.lagSmoothing(0);
        lenisRef.current = lenis;
        const shell = document.querySelector(".portfolio-shell");
        if (shell?.getAttribute("data-preloader") === "active") {
          lenis.stop();
          const startLenis = () => { lenis.start(); };
          window.addEventListener("portfolio:preloader-done", startLenis, { once: true });
        }
        gsap.ticker.add(tick);
      }
      function restoreScroll(event: Event) {
        const top = (event as CustomEvent<number>).detail;
        lenisRef.current?.resize();
        lenisRef.current?.scrollTo(top, { immediate: true, force: true });
      }
      function smoothScroll(event: Event) {
        const top = (event as CustomEvent<number>).detail;
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
          lenisRef.current?.scrollTo(top, { immediate: true, force: true });
        } else {
          lenisRef.current?.resize();
          lenisRef.current?.scrollTo(top, { duration: 1.2, force: true });
        }
      }
      window.addEventListener("portfolio:restore-scroll", restoreScroll);
      window.addEventListener("portfolio:navigate", restoreScroll);
      window.addEventListener("portfolio:smooth-scroll", smoothScroll);
      preference.addEventListener("change", sync);
      window.addEventListener("wheel", onWheel, { passive: true });
      sync();
      return () => {
        window.removeEventListener("portfolio:restore-scroll", restoreScroll);
        window.removeEventListener("portfolio:navigate", restoreScroll);
        window.removeEventListener("portfolio:smooth-scroll", smoothScroll);
        preference.removeEventListener("change", sync);
        window.removeEventListener("wheel", onWheel);
        gsap.ticker.remove(tick);
        lenisRef.current?.destroy();
        lenisRef.current = null;
        visibility.kill();
        resize.disconnect();
      };
    }, 12);
  }, [root, paused]);

  return lenisRef;
}
