"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import type { Locale } from "./intro-content";
import { motionTokens, observeViewportReveal, primeGsapElements, scheduleMotionInit } from "./motion-tokens";
import type { SkillCategoryData } from "@/lib/cms-types";
import { skillGroups } from "./skills-data";

export { skillGroups };

const copy = {
  en: { title: "Skills", stack: "Tools in the work", focus: "Areas of focus", areas: ["Web application development", "Android & mobile applications", "Application logic & data", "Responsive interfaces", "Interface motion & interaction"] },
  id: { title: "Keahlian", stack: "Alat di balik karya", focus: "Bidang fokus", areas: ["Pengembangan aplikasi web", "Aplikasi Android & mobile", "Logika aplikasi & data", "Antarmuka responsif", "Animasi & interaksi antarmuka"] },
};

export default function SkillsSection({
  locale,
  paused,
  cmsSkills,
}: {
  locale: Locale;
  paused: boolean;
  cmsSkills?: { groups: SkillCategoryData[]; areas: string[] };
}) {
  const root = useRef<HTMLElement>(null);
  const text = copy[locale];

  const renderedGroups = cmsSkills?.groups !== undefined
    ? cmsSkills.groups.map(g => ({
        name: g.category,
        skills: g.skills,
      }))
    : [];

  const renderedAreas = cmsSkills?.areas !== undefined
    ? cmsSkills.areas
    : [];

  useEffect(() => {
    if (!root.current || paused) return;
    const host = root.current;
    return scheduleMotionInit(() => {
      const media = gsap.matchMedia(host);
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const chars = host.querySelectorAll<HTMLElement>(".skills-character");
        const panels = host.querySelectorAll<HTMLElement>(".skills-group, .skills-focus");
        const isMob = typeof window !== "undefined" && window.innerWidth < 900;
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
        const panelTween = gsap.from(panels, {
          opacity: 0,
          y: 40,
          duration: motionTokens.duration.contentReveal,
          stagger: motionTokens.stagger.panel,
          ease: motionTokens.ease.power2Out,
          paused: true,
          clearProps: "transform,opacity",
        });
        return observeViewportReveal(host, () => {
          charTween.play();
          panelTween.play();
        });
      });
      return () => media.revert();
    }, 48);
  }, [locale, paused]);

  return <section id="skills" className="skills" ref={root} aria-labelledby="skills-title">
    <div className="skills-header">
      <h2 id="skills-title"><span className="sr-only">{text.title}</span><span className="skills-title-mask" aria-hidden="true">{[...text.title].map((char, i) => <span className="skills-character" key={`${locale}-${i}`}>{char}</span>)}</span></h2>
      <p className="label">{text.stack}</p>
    </div>
    <div className="skills-grid" tabIndex={0} role="region" aria-label={text.stack} onKeyDown={event => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const track = event.currentTarget;
      if (track.scrollWidth <= track.clientWidth) return;
      event.preventDefault();
      const card = track.querySelector<HTMLElement>(".skills-group");
      track.scrollBy({ left: (event.key === "ArrowRight" ? 1 : -1) * ((card?.offsetWidth ?? 0) + 12), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    }}>
      {renderedGroups.length === 0 ? (
        <div style={{ gridColumn: '1 / -1', padding: '32px 24px', color: 'rgba(243, 242, 237, 0.45)', fontFamily: 'var(--font-geist-mono), monospace', fontSize: '13px' }}>
          <span>{locale === 'id' ? '[ Belum ada kategori keahlian ]' : '[ No skill categories available ]'}</span>
        </div>
      ) : (
        renderedGroups.map((group, i) => <div className="skills-group crosshair" key={`${group.name}-${i}`}>
          <div className="skills-group-header"><h3>{group.name}</h3><span className="label">{String(i + 1).padStart(2, "0")}</span></div>
          <ul className="skills-tags">{group.skills.map(tool => <li key={tool}>{tool}</li>)}</ul>
        </div>)
      )}
    </div>
    {renderedAreas.length > 0 && (
      <div className="skills-focus"><p className="label">{text.focus}</p><ul>{renderedAreas.map(area => <li key={area}>{area}</li>)}</ul></div>
    )}
  </section>;
}
