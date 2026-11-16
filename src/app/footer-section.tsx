"use client";

import { useEffect, useRef, type MouseEvent } from "react";
import gsap from "gsap";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { identity, introCopy, type Locale } from "./intro-content";
import { motionTokens, observeViewportReveal, primeGsapElements, scheduleMotionInit } from "./motion-tokens";

export default function FooterSection({ locale, paused }: { locale: Locale; paused: boolean }) {
  const root = useRef<HTMLElement>(null);
  const copy = introCopy[locale];

  useEffect(() => {
    if (!root.current || paused) return;
    const host = root.current;
    return scheduleMotionInit(() => {
      const media = gsap.matchMedia(host);
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const targets = primeGsapElements(host.querySelectorAll<HTMLElement>(".footer-brand-wrap, .footer-social-links, .footer-action-wrap"), { opacity: true });
        const stripTween = gsap.from(targets, {
          opacity: 0,
          y: 16,
          duration: motionTokens.duration.contentReveal,
          stagger: motionTokens.stagger.panel,
          ease: motionTokens.ease.power2Out,
          paused: true,
          clearProps: "transform,opacity",
        });

        return observeViewportReveal(host, () => { stripTween.play(); }, "50px");
      });
      return () => media.revert();
    }, 128);
  }, [locale, paused]);

  function scrollToTop(e: MouseEvent) {
    e.preventDefault();
    if (window.location.hash) {
      history.replaceState(null, "", window.location.pathname);
    }
    window.dispatchEvent(new CustomEvent("portfolio:navigate", { detail: 0 }));
    window.scrollTo({
      top: 0,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }

  return (
    <footer id="footer" ref={root} className="site-footer" role="contentinfo">
      <div className="footer-compact-strip">
        <div className="footer-brand-wrap">
          <span className="monogram" aria-hidden="true">{identity.mark}</span>
          <span className="footer-copyright label mono">© 2026 {identity.name}</span>
        </div>

        <div className="footer-social-links mono">
          <a
            href={identity.github}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-strip-link group"
            aria-label={locale === "id" ? "Profil GitHub (buka di tab baru)" : "GitHub profile (opens in a new tab)"}
          >
            <span>GitHub</span>
            <ArrowUpRight size={13} className="footer-link-arrow" aria-hidden="true" />
          </a>
          <a
            href={identity.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-strip-link group"
            aria-label={locale === "id" ? "Profil LinkedIn (buka di tab baru)" : "LinkedIn profile (opens in a new tab)"}
          >
            <span>LinkedIn</span>
            <ArrowUpRight size={13} className="footer-link-arrow" aria-hidden="true" />
          </a>
        </div>

        <div className="footer-action-wrap">
          <button
            type="button"
            onClick={scrollToTop}
            className="footer-back-to-top label group"
            aria-label={copy.footerBackToTop}
          >
            <span>{copy.footerBackToTop}</span>
            <ArrowUp size={13} className="footer-back-to-top-arrow" aria-hidden="true" />
          </button>
        </div>

        <span className="footer-location-coords sr-only">{copy.footerCoordinates}</span>
      </div>
    </footer>
  );
}
