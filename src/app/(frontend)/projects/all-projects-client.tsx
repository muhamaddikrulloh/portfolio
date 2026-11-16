"use client";

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { useSearchParams } from "next/navigation";
import gsap from "gsap";
import { identity } from "@/app/intro-content";
import { useLocale } from "@/app/locale-provider";
import { observeViewportReveal } from "@/app/motion-tokens";
import { projectsCopy } from "@/app/projects-content";
import { ProjectPixelCover } from "@/app/projects-section";
import { usePageTransition } from "@/app/page-transition";
import type { ProjectItemData } from "@/lib/cms-types";
import "@/app/projects.css";

export default function AllProjectsClient({
  initialProjects,
}: {
  initialProjects?: { en: ProjectItemData[]; id: ProjectItemData[] };
}) {
  const { navigateWithCurtain } = usePageTransition();
  const searchParams = useSearchParams();
  const targetSlug = searchParams.get("project");
  const { locale } = useLocale();

  const activeProjects: ProjectItemData[] = initialProjects?.[locale] !== undefined
    ? initialProjects[locale]
    : [];

  const [manualSelection, setManualSelection] = useState<{ target: string | null; slug: string } | null>(null);
  const [revealedSlugs, setRevealedSlugs] = useState<Record<string, boolean>>({});
  const heroRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const pointerPos = useRef({ x: -1, y: -1 });
  const copy = projectsCopy[locale];

  const activeSlug = manualSelection?.target === targetSlug ? (manualSelection.slug || null) : targetSlug;
  const heroLines = locale === "id"
    ? ["ARSIP", "PROYEK", "KUMPULAN KARYA YANG TELAH SAYA BANGUN."]
    : ["PROJECT", "ARCHIVE", "A COLLECTION OF THINGS I'VE BUILT."];

  useEffect(() => {
    function onScroll() {
      if (!heroRef.current) return;
      const scrollY = window.scrollY;
      const fadeDist = window.innerHeight * 0.55;
      const opacity = Math.max(0, 1 - scrollY / fadeDist);
      heroRef.current.style.opacity = String(opacity);
      heroRef.current.style.visibility = opacity === 0 ? "hidden" : "visible";
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const grid = gridRef.current;
    const hero = heroRef.current;
    if (!grid || !hero) return;
    const cols = 20;

    function buildGrid() {
      if (!grid || !hero) return;
      const colWidth = window.innerWidth / cols;
      if (colWidth <= 0) return;
      const rows = Math.ceil(hero.clientHeight / colWidth);
      const total = rows * cols;
      if (grid.childElementCount !== total) {
        grid.replaceChildren(
          ...Array.from({ length: total }, () => {
            const d = document.createElement("div");
            d.className = "projects-hero-grid-cell";
            return d;
          })
        );
      }
    }

    buildGrid();
    window.addEventListener("resize", buildGrid);

    let lastCol = -1;
    let lastRow = -1;
    function lightCell(c: number, r: number) {
      if (!grid || c < 0 || c >= cols || r < 0) return;
      const cell = grid.children[r * cols + c] as HTMLElement | undefined;
      if (cell) {
        cell.classList.remove("is-lit");
        void cell.offsetWidth;
        cell.classList.add("is-lit");
      }
    }
    function onPointerMove(e: globalThis.PointerEvent) {
      if (!grid || !hero || e.pointerType === "touch") return;
      const rect = hero.getBoundingClientRect();
      const colW = rect.width / cols;
      if (colW <= 0) return;
      const col = Math.floor((e.clientX - rect.left) / colW);
      const row = Math.floor((e.clientY - rect.top) / colW);
      if (col < 0 || col >= cols || row < 0) return;
      if (col === lastCol && row === lastRow) return;
      if (lastCol >= 0 && lastRow >= 0) {
        const steps = Math.max(Math.abs(col - lastCol), Math.abs(row - lastRow));
        for (let s = 1; s <= steps; s++) {
          const ic = Math.round(lastCol + ((col - lastCol) * s) / steps);
          const ir = Math.round(lastRow + ((row - lastRow) * s) / steps);
          lightCell(ic, ir);
        }
      } else {
        lightCell(col, row);
      }
      lastCol = col;
      lastRow = row;
    }

    function onPointerLeave() {
      lastCol = -1;
      lastRow = -1;
    }

    hero.addEventListener("pointermove", onPointerMove as EventListener, { passive: true });
    hero.addEventListener("pointerleave", onPointerLeave);

    return () => {
      window.removeEventListener("resize", buildGrid);
      hero.removeEventListener("pointermove", onPointerMove as EventListener);
      hero.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  useEffect(() => {
    if (!heroRef.current) return;
    const host = heroRef.current;
    const media = gsap.matchMedia(host);
    let entranceComplete = false;
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const isMob = typeof window !== "undefined" && window.innerWidth < 900;
      const tween = gsap.from(host.querySelectorAll(".hero-character"), {
        opacity: 0,
        y: 28,
        scale: 0.94,
        ...(isMob ? {} : { filter: "blur(14px)" }),
        duration: 1.2,
        stagger: 0.018,
        ease: "power3.out",
        paused: true,
        clearProps: isMob ? "transform,opacity" : "transform,opacity,filter",
        onComplete: () => { entranceComplete = true; },
      });
      return observeViewportReveal(host, () => { tween.play(); });
    });

    media.add("(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      const letters = [...host.querySelectorAll<HTMLElement>(".hero-character")].map(element => ({
        element,
        weight: 600,
        scaleY: 1,
        scaleX: 1,
      }));
      let pointerX = Infinity;
      let pointerY = Infinity;

      function updateWeights() {
        if (document.hidden || !entranceComplete) return;
        const activeHover = isFinite(pointerX) && isFinite(pointerY);
        const boxes = letters.map(({ element }) => element.getBoundingClientRect());
        let hasActive = false;
        letters.forEach((letter, index) => {
          const box = boxes[index];
          const distance = activeHover
            ? Math.hypot(box.x + box.width / 2 - pointerX, box.y + box.height / 2 - pointerY)
            : Infinity;
          const influence = Math.max(0, 1 - distance / 300);
          const smooth = influence * influence * (3 - 2 * influence);
          const target = 600 + smooth * 300;
          const targetScaleY = 1 + smooth * 0.16;
          const targetScaleX = 1 + smooth * 0.08;

          letter.weight += (target - letter.weight) * 0.14;
          letter.scaleY += (targetScaleY - letter.scaleY) * 0.14;
          letter.scaleX += (targetScaleX - letter.scaleX) * 0.14;

          if (letter.weight > 601 || letter.scaleY > 1.002) hasActive = true;

          const rounded = Math.round(letter.weight);
          letter.element.style.fontWeight = String(rounded);
          letter.element.style.fontVariationSettings = `'wght' ${rounded}`;
          if (hasActive || activeHover) {
            letter.element.style.transform = `scale(${letter.scaleX.toFixed(3)}, ${letter.scaleY.toFixed(3)})`;
            letter.element.style.transformOrigin = "center bottom";
          } else {
            letter.element.style.removeProperty("transform");
            letter.element.style.removeProperty("transform-origin");
          }
        });
      }
      gsap.ticker.add(updateWeights);

      function move(event: globalThis.PointerEvent) {
        if (event.pointerType === "touch") return;
        pointerX = event.clientX;
        pointerY = event.clientY;
      }
      function leave() {
        pointerX = Infinity;
        pointerY = Infinity;
      }

      window.addEventListener("pointermove", move as unknown as EventListener, { passive: true });
      document.documentElement.addEventListener("pointerleave", leave);
      return () => {
        gsap.ticker.remove(updateWeights);
        letters.forEach(({ element }) => {
          element.style.removeProperty("font-weight");
          element.style.removeProperty("font-variation-settings");
          element.style.removeProperty("transform");
          element.style.removeProperty("transform-origin");
        });
        window.removeEventListener("pointermove", move as unknown as EventListener);
        document.documentElement.removeEventListener("pointerleave", leave);
      };
    });

    return () => media.revert();
  }, [locale]);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver((entries) => {
      const newlyVisible: string[] = [];
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const slug = entry.target.getAttribute("data-slug");
          if (slug) {
            newlyVisible.push(slug);
            io.unobserve(entry.target);
          }
        }
      });
      if (newlyVisible.length > 0) {
        setRevealedSlugs(prev => {
          const next = { ...prev };
          newlyVisible.forEach(s => { next[s] = true; });
          return next;
        });
      }
    }, { rootMargin: "0px 0px -10% 0px" });

    const rows = document.querySelectorAll<HTMLElement>(".archive-project");
    rows.forEach(r => io.observe(r));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    function trackPointer(e: globalThis.PointerEvent) {
      pointerPos.current = { x: e.clientX, y: e.clientY };
    }
    window.addEventListener("pointermove", trackPointer as EventListener, { passive: true });

    let lastHovered: HTMLButtonElement | null = null;
    function checkHoverOnScroll() {
      const { x, y } = pointerPos.current;
      if (x < 0 || y < 0) return;
      const target = document.elementFromPoint(x, y);
      const row = target?.closest<HTMLButtonElement>(".archive-row");
      if (row !== lastHovered) {
        if (lastHovered) {
          const rect = lastHovered.getBoundingClientRect();
          const from = y < rect.top + rect.height / 2 ? "-100%" : "100%";
          lastHovered.classList.remove("is-hovering");
          lastHovered.classList.add("is-leaving");
          lastHovered.style.setProperty("--from", from);
        }
        if (row) {
          const rect = row.getBoundingClientRect();
          const from = y < rect.top + rect.height / 2 ? "-100%" : "100%";
          row.classList.remove("is-leaving");
          row.style.setProperty("--from", from);
          void row.offsetWidth;
          row.classList.add("is-hovering");
        }
        lastHovered = row ?? null;
      }
    }
    window.addEventListener("scroll", checkHoverOnScroll, { passive: true });

    return () => {
      window.removeEventListener("pointermove", trackPointer as EventListener);
      window.removeEventListener("scroll", checkHoverOnScroll);
    };
  }, []);

  useEffect(() => {
    if (!targetSlug) return;
    const scrollToProject = () => {
      const el = document.getElementById(`project-item-${targetSlug}`);
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 32;
        window.scrollTo({ top: Math.max(0, top), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
      }
    };
    const t1 = setTimeout(scrollToProject, 100);
    const t2 = setTimeout(scrollToProject, 450);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [targetSlug]);

  function handleBack(event?: MouseEvent) {
    event?.preventDefault();
    navigateWithCurtain("/#projects", "down");
  }

  function rowEnter(event: MouseEvent<HTMLButtonElement>) {
    if (!matchMedia("(hover: hover)").matches) return;
    const row = event.currentTarget;
    const rect = row.getBoundingClientRect();
    const from = event.clientY < rect.top + rect.height / 2 ? "-100%" : "100%";
    row.classList.remove("is-leaving");
    row.style.setProperty("--from", from);
    void row.offsetWidth;
    row.classList.add("is-hovering");
  }

  function rowLeave(event: MouseEvent<HTMLButtonElement>) {
    if (!matchMedia("(hover: hover)").matches) return;
    const row = event.currentTarget;
    const rect = row.getBoundingClientRect();
    const from = event.clientY < rect.top + rect.height / 2 ? "-100%" : "100%";
    row.classList.remove("is-hovering");
    row.classList.add("is-leaving");
    row.style.setProperty("--from", from);
  }

  function toggleProject(slug: string) {
    setManualSelection({ target: targetSlug, slug: activeSlug === slug ? "" : slug });
  }

  return <main id="main-content" tabIndex={-1} className="projects-page" data-motion="on">
    <section ref={heroRef} className="projects-archive-hero" aria-labelledby="projects-hero-title">
      <div ref={gridRef} className="projects-hero-grid" aria-hidden="true" />

      <div className="hero-ornament-rail left" aria-hidden="true">
        <span className="ornament-rail-line" />
        <span className="ornament-rail-text mono">{identity.coordinates}</span>
        <span className="ornament-cross">✦</span>
      </div>

      <div className="hero-ornament-rail right" aria-hidden="true">
        <span className="ornament-cross">✦</span>
        <span className="ornament-rail-text mono">FOLIO // 2026</span>
        <span className="ornament-rail-line" />
      </div>

      <h1 id="projects-hero-title" className="projects-archive-hero-title display" aria-label={heroLines.join(". ")}>
        {heroLines.map((line, i) => (
          <span
            className={`hero-line ${i === 1 ? "outline-line" : ""} ${i === 2 ? "hero-line-sub" : ""}`}
            key={`${locale}-${i}`}
            aria-hidden="true"
          >
            <span className="hero-line-inner">
              {[...line].map((letter, index) => (
                <span className="hero-character" key={`${locale}-${index}`}>
                  {letter === " " ? "\u00a0" : letter}
                </span>
              ))}
            </span>
          </span>
        ))}
      </h1>

      <div className="hero-ornament-corner bottom-left mono" aria-hidden="true">
        <span className="ornament-cross">✦</span>
        <span className="ornament-meta">{locale === "id" ? "INDEKS" : "INDEX"} [01–{String(activeProjects.length).padStart(2, "0")}]</span>
      </div>

      <div className="hero-ornament-corner bottom-right mono" aria-hidden="true">
        <span className="ornament-meta">{locale === "id" ? "GRID 12 · MATRIKS" : "GRID 12 · MATRIX"}</span>
        <span className="ornament-cross">✦</span>
      </div>

      <a className="projects-hero-scroll mono" href="#project-archive">
        <span className="ornament-bracket">[</span>
        <span>{copy.scroll}</span>
        <span className="ornament-arrow" aria-hidden="true">↓</span>
        <span className="ornament-bracket">]</span>
      </a>
    </section>

    <div className="projects-page-inner" id="project-archive">
      <p className="projects-archive-label label">[ <span className="highlight">03</span> / 04 ] · {copy.work} <span className="count-highlight">({activeProjects.length})</span></p>
      <div className="archive-list crosshair">
        <div className="archive-head" aria-hidden="true">
          <span>{copy.colProject}</span>
          <span className="archive-col-wide">{copy.colCategory}</span>
          <span className="archive-col-wide">{copy.colStack}</span>
          <span className="archive-year">{copy.colYear}</span>
        </div>
        {activeProjects.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'rgba(243, 242, 237, 0.45)', fontFamily: 'var(--font-geist-mono), monospace', fontSize: '13px' }}>
            <span>{locale === 'id' ? '[ Belum ada proyek dalam arsip ]' : '[ No projects found in archive ]'}</span>
          </div>
        ) : (
          activeProjects.map((project, index) => {
            const isOpen = activeSlug === project.slug;
            const isRevealed = Boolean(targetSlug || revealedSlugs[project.slug]);
            return <article
              key={project.slug}
              id={`project-item-${project.slug}`}
              data-slug={project.slug}
              className={`archive-project${isRevealed ? " is-in" : ""}${isOpen ? " is-open" : ""}`}
              style={{ "--row-delay": `${index * 80}ms` } as CSSProperties}
            >
              <button
                type="button"
                className="archive-row"
                data-cursor={isOpen ? (locale === "id" ? "Tutup" : "Close") : (locale === "id" ? "Buka" : "Open")}
                aria-expanded={isOpen}
                aria-controls={`archive-body-${index}`}
                onMouseEnter={rowEnter}
                onMouseLeave={rowLeave}
                onClick={() => toggleProject(project.slug)}
              >
                <span className="archive-bg" aria-hidden="true" />
                <span className="archive-cell" style={{ "--i": 0 } as CSSProperties}>
                  <span className="archive-text">
                    <span className="archive-index">#{index + 1}</span> {project.title}
                  </span>
                </span>
                <span className="archive-cell archive-col-wide" style={{ "--i": 1 } as CSSProperties}>
                  <span className="archive-text">{project.kind}</span>
                </span>
                <span className="archive-cell archive-col-wide" style={{ "--i": 2 } as CSSProperties}>
                  <span className="archive-text">{project.technologies.join(", ")}</span>
                </span>
                <span className="archive-cell archive-year" style={{ "--i": 3 } as CSSProperties}>
                  <span className="archive-text">{project.year}</span>
                </span>
              </button>
              <div id={`archive-body-${index}`} className="archive-body" inert={!isOpen}>
                <div className="archive-inner">
                  <div className="archive-detail-lead">
                    <h2 className="archive-detail-title">{project.title}</h2>
                    <p className="archive-desc">{project.description || project.summary}</p>
                    <ul className="project-technologies mono" aria-label={copy.stack}>
                      {project.technologies.map(tech => <li key={tech}>{tech}</li>)}
                    </ul>
                    {project.githubUrl && (
                      <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="archive-repository-link mono">
                        GitHub <span aria-hidden="true">↗</span>
                      </a>
                    )}
                  </div>
                  <div className="archive-images">
                    {project.gallery && project.gallery.length > 0 ? (
                      project.gallery.map((image, imageIndex) => (
                        <div className="archive-image" key={`${image.url}-${imageIndex}`}>
                          <ProjectPixelCover prepareNearRow={imageIndex === 0} interaction="toggle" locale={locale} visual={project.visual} title={image.alt || `${project.title} — 0${imageIndex + 1}`} paused={false} imageUrl={image.url} imageData={image} />
                        </div>
                      ))
                    ) : (
                      <div className="archive-image">
                        <ProjectPixelCover prepareNearRow interaction="toggle" locale={locale} visual={project.visual} title={project.title} paused={false} imageUrl={project.imageUrl} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </article>;
          })
        )}
      </div>
      <div className="project-archive-footer">
        <button type="button" className="project-dialog-close-bottom mono" onClick={() => handleBack()}>
          <span>← {copy.back}</span>
        </button>
        <a
          href="#projects-hero-title"
          className="project-archive-to-top mono"
          onClick={event => {
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
          }}
        >
          {copy.scroll} ↑
        </a>
      </div>
    </div>
  </main>;
}
