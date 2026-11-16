"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import type { Locale } from "./intro-content";
import { motionTokens, observeViewportReveal, primeGsapElements, scheduleMotionInit } from "./motion-tokens";
import type { ExperienceItemData } from "@/lib/cms-types";

const copy = {
  en: { eyebrow: "Experience", title: "Career & Roles.", role: "Role", organization: "Organization", period: "Period", description: "A description of the role, its context, and the responsibilities involved. Additional details describe the work and its scope.", tags: ["Responsibility", "Process", "Collaboration"], more: "Read more", less: "Show less" },
  id: { eyebrow: "Pengalaman", title: "Jejak Pengalaman.", role: "Peran", organization: "Organisasi", period: "Periode", description: "Deskripsi peran, konteks, dan tanggung jawab yang terkait. Rincian tambahan menjelaskan pekerjaan dan cakupannya.", tags: ["Tanggung jawab", "Proses", "Kolaborasi"], more: "Baca selengkapnya", less: "Tampilkan lebih sedikit" },
};

export default function ExperienceSection({
  locale,
  paused,
  cmsExperience,
}: {
  locale: Locale;
  paused: boolean;
  cmsExperience?: ExperienceItemData[];
}) {
  const root = useRef<HTMLElement>(null);
  const text = copy[locale];
  const [expanded, setExpanded] = useState<(string | number)[]>([]);

  const entries = cmsExperience !== undefined
    ? cmsExperience
    : [];

  useEffect(() => {
    if (!root.current || paused) return;
    const host = root.current;
    return scheduleMotionInit(() => {
      const media = gsap.matchMedia(host);
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const cleanups: (() => void)[] = [];
        const chars = host.querySelectorAll<HTMLElement>(".experience-heading-character");
        const entryNodes = gsap.utils.toArray<HTMLElement>(".experience-entry", host);
        const isMob = typeof window !== "undefined" && window.innerWidth < 900;
        primeGsapElements([...chars, ...entryNodes]);
        for (const el of chars) {
          if (!el.style.opacity) el.style.opacity = "1";
          if (!isMob && !el.style.filter) el.style.filter = "blur(0px)";
        }
        for (const el of entryNodes) {
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
        cleanups.push(observeViewportReveal(host, () => { charTween.play(); }));
        entryNodes.forEach(entry => {
          const entryTween = gsap.from(entry, {
            opacity: 0,
            y: 40,
            duration: motionTokens.duration.contentReveal,
            ease: motionTokens.ease.power2Out,
            paused: true,
            clearProps: "transform,opacity",
          });
          cleanups.push(observeViewportReveal(entry, () => { entryTween.play(); }));
        });
        return () => cleanups.forEach(fn => fn());
      });
      return () => media.revert();
    }, 64);
  }, [locale, paused]);

  return <section id="experience" className="experience" ref={root} aria-labelledby="experience-title">
    <div className="experience-header">
      <div className="experience-eyebrow label">
        <span className="eyebrow-line" aria-hidden="true" />
        <span aria-hidden="true" className="eyebrow-index">[ <span className="highlight">02</span> / 04 ]</span>
        <span aria-hidden="true" className="eyebrow-dot">·</span>
        <span>{text.eyebrow}</span>
      </div>
      <h2 id="experience-title" className="experience-heading display">
        <span className="sr-only">{text.title}</span>
        <span className="experience-title-mask" aria-hidden="true">
          {[...text.title].map((char, index) => (
            <span className="experience-heading-character" key={`${locale}-${index}`}>
              {char === " " ? "\u00a0" : char}
            </span>
          ))}
        </span>
      </h2>
    </div>
    <div className="experience-list">
      {entries.length === 0 ? (
        <div style={{ padding: '32px 0', color: 'rgba(243, 242, 237, 0.45)', fontFamily: 'var(--font-geist-mono), monospace', fontSize: '13px' }}>
          <span>{locale === 'id' ? '[ Belum ada riwayat pengalaman ]' : '[ No experience entries available ]'}</span>
        </div>
      ) : (
        entries.map((entry, index) => <article className="experience-entry" key={entry.id}>
          <p className="experience-period label"><span>#{index + 1}</span> · {entry.period}</p>
          <div className="experience-role"><h3>{entry.position}</h3><p className="label">{entry.organization}</p></div>
          <div className="experience-content"><div id={`experience-description-${entry.id}`} className={`experience-description${expanded.includes(entry.id) ? " is-expanded" : ""}`}><div><p>{entry.description}</p><ul>{entry.skills.map(tag => <li key={tag}>{tag}</li>)}</ul></div></div><button className="experience-toggle label" type="button" aria-expanded={expanded.includes(entry.id)} aria-controls={`experience-description-${entry.id}`} onClick={() => setExpanded(current => current.includes(entry.id) ? current.filter(item => item !== entry.id) : [...current, entry.id])}>{expanded.includes(entry.id) ? text.less : text.more}</button></div>
        </article>)
      )}
    </div>
  </section>;
}
