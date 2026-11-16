"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { motionTokens, scheduleMotionInit } from "./motion-tokens";

export default function PointerCursor() {
  const cursor = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = cursor.current;
    if (!element) return;
    const home = element.parentElement!;
    const label = element.querySelector("em")!;
    return scheduleMotionInit(() => {
      const media = gsap.matchMedia();
      media.add("(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
        const x = gsap.quickTo(element, "x", { duration: motionTokens.duration.micro, ease: motionTokens.ease.power3Out });
        const y = gsap.quickTo(element, "y", { duration: motionTokens.duration.micro, ease: motionTokens.ease.power3Out });
        let activeNode: HTMLElement | null = null;
        const hide = () => { activeNode = null; element.dataset.visible = "false"; };
        const move = (event: PointerEvent) => {
          if (event.pointerType === "touch" || !(event.target instanceof Element)) return;
          const modal = event.target.closest("dialog[open]");
          const parent = modal ?? home;
          if (element.parentElement !== parent) parent.append(element);
          element.dataset.visible = "true";
          const node = event.target.closest<HTMLElement>("[data-cursor]");
          activeNode = node;
          label.textContent = node?.dataset.cursor ?? "";
          element.dataset.state = node ? "label" : "";
          element.dataset.link = String(Boolean(!node && event.target.closest("a, button")));
          x(event.clientX); y(event.clientY);
        };
        const observer = new MutationObserver(() => {
          if (element.parentElement instanceof HTMLDialogElement && !element.parentElement.open) { home.append(element); hide(); }
          if (activeNode) label.textContent = activeNode.dataset.cursor ?? "";
        });
        observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["open", "data-cursor"] });
        window.addEventListener("pointermove", move, { passive: true });
        document.documentElement.addEventListener("pointerleave", hide);
        window.addEventListener("keydown", hide);
        return () => {
          observer.disconnect(); home.append(element); hide(); gsap.killTweensOf(element);
          window.removeEventListener("pointermove", move);
          document.documentElement.removeEventListener("pointerleave", hide);
          window.removeEventListener("keydown", hide);
        };
      });
      return () => media.revert();
    }, 16);
  }, []);
  return <div ref={cursor} className="pointer-reticle" aria-hidden="true" data-visible="false"><span /><em className="pointer-label" /></div>;
}
