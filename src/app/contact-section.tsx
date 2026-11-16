"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { introCopy, type Locale } from "./intro-content";
import { motionTokens, observeViewportReveal, primeGsapElements, scheduleMotionInit } from "./motion-tokens";
import type { ContactData } from "@/lib/cms-types";
import { contactRowHref } from "@/lib/cms-types";

const ContactIdBadge = dynamic(() => import("./contact-id-badge"), {
  ssr: false,
});

const platformLabels: Record<string, string> = {
  github: "GitHub",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  tiktok: "TikTok",
  twitter: "X / Twitter",
  threads: "Threads",
};

function PlatformIcon({ platform }: { platform: string }) {
  switch (platform) {
    case "github":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
          <path d="M9 18c-4.51 2-5-2-7-2" />
        </svg>
      );
    case "linkedin":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect width="4" height="12" x="2" y="9" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      );
    case "instagram":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      );
    case "facebook":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      );
    case "youtube":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
          <polygon points="10 15 15 12 10 9 10 15" />
        </svg>
      );
    case "tiktok":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
        </svg>
      );
    case "twitter":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
          <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
        </svg>
      );
    case "threads":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" />
        </svg>
      );
    default:
      return <ArrowUpRight size={15} aria-hidden="true" />;
  }
}

export default function ContactSection({
  locale,
  paused,
  cmsContact,
}: {
  locale: Locale;
  paused: boolean;
  cmsContact?: ContactData;
}) {
  const root = useRef<HTMLElement>(null);
  const [shouldLoadBadge, setShouldLoadBadge] = useState(() => typeof window !== "undefined" && window.location.hash === "#contact");
  const copy = introCopy[locale];
  const heading = cmsContact?.heading?.trim() || copy.contactTitle;

  useEffect(() => {
    if (shouldLoadBadge) return;
    const el = root.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShouldLoadBadge(true);
        observer.disconnect();
      }
    }, { rootMargin: "1000px 0px" });
    observer.observe(el);

    const onHash = () => {
      if (window.location.hash === "#contact") {
        setShouldLoadBadge(true);
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", onHash);
    };
  }, [shouldLoadBadge]);

  useEffect(() => {
    if (!root.current || paused) return;
    const host = root.current;
    return scheduleMotionInit(() => {
      const media = gsap.matchMedia(host);

      media.add("(prefers-reduced-motion: no-preference)", () => {
        const isMob = typeof window !== "undefined" && window.innerWidth < 900;
        const chars = host.querySelectorAll<HTMLElement>(".contact-character");
        const panels = host.querySelectorAll<HTMLElement>(".contact-eyebrow, .contact-row, .contact-actions, .contact-badge-stage");
        primeGsapElements([...chars, ...panels]);
        for (const el of chars) {
          if (!el.style.opacity) el.style.opacity = "1";
          if (!isMob && !el.style.filter) el.style.filter = "blur(0px)";
        }
        for (const el of panels) {
          if (!el.style.opacity) el.style.opacity = "1";
        }
        const charTween = gsap.from(chars, {
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
        const cleanups = [observeViewportReveal(host, () => { charTween.play(); })];
        panels.forEach(element => {
          const panelTween = gsap.from(element, {
            opacity: 0,
            y: 40,
            duration: motionTokens.duration.contentReveal,
            ease: motionTokens.ease.power2Out,
            paused: true,
            clearProps: "transform,opacity",
          });
          cleanups.push(observeViewportReveal(element, () => { panelTween.play(); }));
        });
        return () => cleanups.forEach(cleanup => cleanup());
      });

    // Proximity font-weight hover animation identical to hero headline
    media.add("(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      const letters = [...host.querySelectorAll<HTMLElement>(".contact-character")].map(element => ({
        element,
        weight: 300,
      }));
      let pointerX = Infinity;
      let pointerY = Infinity;
      let needsUpdate = false;

      function updateWeights() {
        if (paused || document.hidden || !needsUpdate) return;
        const activeHover = isFinite(pointerX) && isFinite(pointerY);
        const boxes = letters.map(({ element }) => element.getBoundingClientRect());
        let hasActive = false;
        letters.forEach((letter, index) => {
          const box = boxes[index];
          const distance = activeHover
            ? Math.hypot(box.x + box.width / 2 - pointerX, box.y + box.height / 2 - pointerY)
            : Infinity;
          const influence = Math.max(0, 1 - distance / 280);
          const target = 300 + influence * influence * (3 - 2 * influence) * 550;
          letter.weight += (target - letter.weight) * 0.14;
          if (letter.weight > 301) hasActive = true;
          const rounded = Math.round(letter.weight);
          letter.element.style.fontWeight = String(rounded);
          letter.element.style.fontVariationSettings = `'wght' ${rounded}`;
        });
        if (!activeHover && !hasActive) needsUpdate = false;
      }

      gsap.ticker.add(updateWeights);

      function move(event: PointerEvent) {
        if (paused || event.pointerType === "touch") return;
        pointerX = event.clientX;
        pointerY = event.clientY;
        needsUpdate = true;
      }

      function leave() {
        pointerX = Infinity;
        pointerY = Infinity;
      }

      window.addEventListener("pointermove", move as EventListener, { passive: true });
      window.addEventListener("mousemove", move as EventListener, { passive: true });
      window.addEventListener("pointerleave", leave);

      return () => {
        gsap.ticker.remove(updateWeights);
        letters.forEach(({ element }) => {
          element.style.removeProperty("font-weight");
          element.style.removeProperty("font-variation-settings");
        });
        window.removeEventListener("pointermove", move as EventListener);
        window.removeEventListener("mousemove", move as EventListener);
        window.removeEventListener("pointerleave", leave);
      };
    });

      return () => media.revert();
    }, 112);
  }, [locale, paused, heading]);

  return (
    <section id="contact" ref={root} className="contact-section" aria-labelledby="contact-title">
      {/* Interactive 3D ID badge stage spanning full section, layered above text */}
      <div className="contact-badge-stage">
        {shouldLoadBadge && <ContactIdBadge locale={locale} paused={paused} />}
      </div>

      <div className="contact-grid">
        {/* Left Column — Editorial Contact Info */}
        <div className="contact-col contact-info">
          <div className="contact-eyebrow label">
            <span className="eyebrow-line" aria-hidden="true" />
            <span aria-hidden="true" className="eyebrow-index">[ <span className="highlight">04</span> / 04 ]</span>
            <span aria-hidden="true" className="eyebrow-dot">·</span>
            <span>{copy.contact}</span>
          </div>

          <h2 id="contact-title" className="contact-heading display">
            <span className="sr-only">{heading}</span>
            <span className="contact-title-mask" aria-hidden="true">
              {[...heading].map((char, index) => (
                <span className="contact-char contact-character" key={`${locale}-${index}`}>
                  {char === " " ? "\u00a0" : char}
                </span>
              ))}
            </span>
          </h2>

          <ul className="contact-entries">
            {cmsContact?.contactRows && cmsContact.contactRows.length > 0 ? (
              cmsContact.contactRows.map((row, idx) => {
                const isEmail = row.type === 'email' || (!row.type && row.label.toLowerCase().includes('email'));
                const isPhone = row.type === 'phone';
                const isLocation = row.type === 'location' || (!row.type && (row.label.toLowerCase().includes('base') || row.label.toLowerCase().includes('lokasi')));
                const href = contactRowHref(row);
                const isSocial = row.type && Object.hasOwn(platformLabels, row.type);

                return (
                  <li className="contact-row" key={`${row.label}-${idx}`}>
                    <span className="contact-row-label label mono">{row.label}</span>
                    {href ? (
                      <a
                        href={href}
                        target={isEmail || isPhone ? undefined : "_blank"}
                        rel={isEmail || isPhone ? undefined : "noopener noreferrer"}
                        data-cursor={isEmail ? (locale === "id" ? "Tulis" : "Write") : undefined}
                        className="contact-row-value group"
                        aria-label={`${row.label} ${row.value}`}
                      >
                        {isEmail ? (
                          <Mail size={18} className="contact-row-icon" aria-hidden="true" />
                        ) : isPhone ? (
                          <Phone size={18} className="contact-row-icon" aria-hidden="true" />
                        ) : isLocation ? (
                          <MapPin size={18} className="contact-row-icon" aria-hidden="true" />
                        ) : isSocial ? (
                          <span className="contact-row-icon"><PlatformIcon platform={row.type!} /></span>
                        ) : (
                          <ArrowUpRight size={18} className="contact-row-icon" aria-hidden="true" />
                        )}
                        <span className="contact-row-text mono">{row.value}</span>
                        <ArrowUpRight size={15} className="contact-row-arrow" aria-hidden="true" />
                      </a>
                    ) : (
                      <div className="contact-row-value">
                        {isLocation ? (
                          <MapPin size={18} className="contact-row-icon" aria-hidden="true" />
                        ) : isEmail ? (
                          <Mail size={18} className="contact-row-icon" aria-hidden="true" />
                        ) : isPhone ? (
                          <Phone size={18} className="contact-row-icon" aria-hidden="true" />
                        ) : isSocial ? (
                          <span className="contact-row-icon"><PlatformIcon platform={row.type!} /></span>
                        ) : null}
                        <span className="contact-row-text mono">{row.value}</span>
                      </div>
                    )}
                  </li>
                );
              })
            ) : (
              <li className="contact-row" style={{ color: 'rgba(243, 242, 237, 0.45)', fontFamily: 'var(--font-geist-mono), monospace', fontSize: '12px' }}>
                <span>{locale === 'id' ? '[ Belum ada informasi kontak ]' : '[ No contact entries available ]'}</span>
              </li>
            )}
          </ul>

          {cmsContact?.socialLinks && cmsContact.socialLinks.length > 0 && (
            <div className="contact-actions">
              {cmsContact.socialLinks.map((social) => {
                const label = platformLabels[social.platform] || social.platform;
                return (
                  <a
                    key={`${social.platform}-${social.url}`}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost"
                    aria-label={`${locale === "id" ? "Profil" : "Profile"} ${label}`}
                  >
                    <PlatformIcon platform={social.platform} />
                    <span>{label}</span>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column Layout Anchor (preserves the right column space on desktop / bottom space on mobile) */}
        <div className="contact-col contact-card-slot" aria-hidden="true" />
      </div>
    </section>
  );
}
