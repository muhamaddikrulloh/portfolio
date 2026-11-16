"use client";

import { useEffect, useRef, useState, type FocusEvent, type PointerEvent } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import type { Locale } from "./intro-content";
import { observeViewportReveal, primeGsapElements, scheduleMotionInit } from "./motion-tokens";
import { projectsCopy } from "./projects-content";
import { usePageTransition } from "./page-transition";
import { normalizeProjectVisual, projectImageSource, type ProjectImageData, type ProjectItemData } from "@/lib/cms-types";
import "./projects.css";

gsap.registerPlugin(ScrollTrigger);

let stRefreshRaf = 0;
function requestDebouncedScrollTriggerRefresh() {
  if (typeof window === "undefined") return;
  cancelAnimationFrame(stRefreshRaf);
  stRefreshRaf = requestAnimationFrame(() => {
    ScrollTrigger.refresh();
  });
}

function drawArtworkContent(ctx: CanvasRenderingContext2D, visual: string, color: boolean) {
  ctx.font = '18px "Geist Mono", monospace';
  const fallback = normalizeProjectVisual(visual);
  if (fallback === "none") return;
  if (fallback === "web-app") {
    ctx.fillStyle = "#20201e";
    ctx.strokeStyle = "#65645e";
    ctx.lineWidth = 1;
    ctx.fillRect(68, 65, 664, 430);
    ctx.strokeRect(68, 65, 664, 430);
    ctx.beginPath();
    ctx.moveTo(68, 110);
    ctx.lineTo(732, 110);
    ctx.moveTo(226, 110);
    ctx.lineTo(226, 495);
    ctx.stroke();
    ctx.fillStyle = "#f3f2ed";
    ctx.fillText("WEB APP / CONCEPT", 88, 94);
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i === 0 ? (color ? "#ff4d00" : "#7a7870") : "#33332f";
      ctx.fillRect(88, 142 + i * 55, 112, 30);
      const bx = 252 + (i % 2) * 224;
      const by = 142 + Math.floor(i / 2) * 155;
      ctx.fillStyle = "#33332f";
      ctx.fillRect(bx, by, 198, 130);
      ctx.strokeRect(bx, by, 198, 130);
      ctx.fillStyle = color ? "#ff4d00" : "#a4a08c";
      ctx.fillRect(bx + 23, by + 25, 152, 48);
      ctx.fillStyle = "#d8d4c6";
      ctx.fillRect(bx + 23, by + 93, 96, 6);
    }
  } else if (fallback === "mobile-app") {
    ctx.fillStyle = "#22221f";
    ctx.strokeStyle = "#8b887d";
    ctx.lineWidth = 2;
    ctx.fillRect(256, 38, 288, 486);
    ctx.strokeRect(256, 38, 288, 486);
    ctx.fillStyle = "#0b0b0b";
    ctx.fillRect(350, 50, 100, 14);
    ctx.fillStyle = "#f3f2ed";
    ctx.font = '30px "Geist Mono", monospace';
    ctx.fillText("Mobile", 282, 120);
    for (let i = 0; i < 3; i++) {
      const by = 150 + i * 106;
      ctx.fillStyle = i === 0 ? (color ? "#ff4d00" : "#69604b") : "#363630";
      ctx.fillRect(280, by, 240, 88);
      ctx.fillStyle = color && i === 0 ? "#0b0b0b" : "#d8d4c6";
      ctx.fillRect(300, by + 22, 106, 3);
      ctx.fillRect(300, by + 40, 184, 3);
      ctx.fillRect(300, by + 56, 150, 3);
    }
  } else {
    ctx.fillStyle = "#262824";
    ctx.strokeStyle = "#787c6e";
    ctx.lineWidth = 1;
    ctx.fillRect(65, 65, 670, 430);
    ctx.strokeRect(65, 65, 670, 430);
    ctx.fillStyle = "#f3f2ed";
    ctx.fillText("UI/UX / WIREFRAME", 92, 108);
    for (let i = 0; i < 3; i++) {
      const x = 94 + i * 210;
      ctx.strokeRect(x, 150, 190, 300);
      ctx.fillStyle = color ? "#59624c" : "#4b4b46";
      ctx.fillRect(x + 16, 168, 158, 110);
      ctx.fillStyle = "#d8d4c6";
      ctx.fillRect(x + 16, 302, 112, 5);
      ctx.fillRect(x + 16, 324, 158, 3);
      ctx.fillRect(x + 16, 342, 132, 3);
      ctx.fillStyle = color ? "#ff4d00" : "#a4a08c";
      ctx.fillRect(x + 16, 386, 90, 32);
    }
  }
}

export function ProjectPixelCover({ visual, title, paused, imageUrl, imageData, locale = "en", interaction = "hold", prepareNearRow = false }: { visual: string; title: string; paused: boolean; imageUrl?: string; imageData?: ProjectImageData; locale?: Locale; interaction?: "hold" | "toggle"; prepareNearRow?: boolean }) {
  const [colorVisible, setColorVisible] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement>(null);
  const revealCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const base = baseCanvasRef.current;
    const reveal = revealCanvasRef.current;
    if (!host || !base || !reveal) return;
    const baseCtx = base.getContext("2d");
    const revealCtx = reveal.getContext("2d");
    if (!baseCtx || !revealCtx) return;
    let prepared = false;
    let disposed = false;
    let renderTimer = 0;
    let imageRevision = 0;
    let renderedRevision = -1;

    const originalUrl = imageData?.url || imageUrl;
    const image = originalUrl ? new Image() : null;
    let requestedUrl = "";
    let originalLoaded = false;
    let imageReady = false;
    let bitmap: ImageBitmap | null = null;
    host.dataset.revealed = "false";

    const draw = (ctx: CanvasRenderingContext2D, w: number, h: number, color: boolean) => {
      ctx.save();
      if (image && !imageReady) {
        ctx.fillStyle = "#141413";
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
        return;
      }
      if (image && imageReady) {
        ctx.fillStyle = "#141413";
        ctx.fillRect(0, 0, w, h);
        const sourceWidth = bitmap?.width || image.naturalWidth;
        const sourceHeight = bitmap?.height || image.naturalHeight;
        const scale = Math.min(w / sourceWidth, h / sourceHeight);
        const iw = sourceWidth * scale;
        const ih = sourceHeight * scale;
        ctx.filter = color ? "none" : "grayscale(1) contrast(1.08)";
        ctx.drawImage(bitmap || image, (w - iw) / 2, (h - ih) / 2, iw, ih);
        ctx.restore();
        return;
      }
      ctx.scale(w / 800, h / 560);
      ctx.fillStyle = "#141413";
      ctx.fillRect(0, 0, 800, 560);

      // 1. Technical background dot matrix (identical to original procedural artworks)
      ctx.fillStyle = color ? "rgba(243,242,237,0.14)" : "rgba(216,212,198,0.22)";
      for (let y = 1; y < 560; y += 8) {
        for (let x = 1; x < 800; x += 8) ctx.fillRect(x, y, 1.4, 1.4);
      }

      drawArtworkContent(ctx, visual, color);

      // 2. ASCII / halftone dot grid overlay on base (grayscale) canvas
      if (!color) {
        ctx.fillStyle = "rgba(11,11,11,0.38)";
        for (let y = 0; y < 560; y += 6) {
          for (let x = (y / 6) % 2 ? 3 : 0; x < 800; x += 6) ctx.fillRect(x, y, 2, 2);
        }
      }

      // 3. Technical monospace stamp
      ctx.fillStyle = "rgba(243,242,237,0.55)";
      ctx.font = '10px "Geist Mono", monospace';
      ctx.fillText(title.toUpperCase(), 24, 538);
      ctx.restore();
    };

    const render = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(host.clientWidth * dpr));
      const h = Math.max(1, Math.round(host.clientHeight * dpr));
      if (base.width !== w || base.height !== h) {
        base.width = reveal.width = w;
        base.height = reveal.height = h;
        renderedRevision = -1;
      }
      if (renderedRevision === imageRevision) return;
      renderedRevision = imageRevision;
      draw(revealCtx, w, h, true);
      draw(baseCtx, w, h, false);
      host.dataset.revealed = !image || imageReady ? "true" : "false";
    };

    const scheduleRender = () => {
      if (disposed || renderTimer) return;
      renderTimer = window.setTimeout(() => {
        renderTimer = 0;
        if (disposed) return;
        render();
      }, 0);
    };

    const loadImage = () => {
      if (!prepared || !image || !originalUrl || originalLoaded) return;
      const frame = prepareNearRow ? host.parentElement : host;
      const url = imageData ? projectImageSource(imageData, frame?.clientWidth || host.clientWidth, frame?.clientHeight || host.clientHeight, Math.min(window.devicePixelRatio || 1, 2)) : originalUrl;
      if (url === requestedUrl) return;
      requestedUrl = url;
      imageReady = false;
      host.dataset.revealed = "false";
      imageRevision++;
      image.src = url;
    };
    if (image) {
      image.onload = async () => {
        const loadedUrl = requestedUrl;
        let decoded: ImageBitmap | null = null;
        try {
          decoded = await createImageBitmap(image);
        } catch {}
        if (disposed || requestedUrl !== loadedUrl) {
          decoded?.close();
          return;
        }
        bitmap?.close();
        bitmap = decoded;
        originalLoaded = requestedUrl === originalUrl;
        imageReady = image.naturalWidth > 0 && image.naturalHeight > 0;
        imageRevision++;
        if (prepared) scheduleRender();
      };
      image.onerror = () => {
        if (disposed) return;
        if (requestedUrl !== originalUrl && originalUrl) {
          requestedUrl = originalUrl;
          image.src = originalUrl;
          return;
        }
        imageRevision++;
        if (prepared) scheduleRender();
      };
    }
    const prepare = () => {
      if (disposed || prepared) return;
      prepared = true;
      loadImage();
      scheduleRender();
    };
    const prepIo = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting || disposed) return;
      prepare();
      prepIo.disconnect();
    }, { rootMargin: "800px 0px" });
    const preparationRow = prepareNearRow ? host.closest(".archive-project")?.querySelector(".archive-row") : null;
    prepIo.observe(preparationRow || host);
    preparationRow?.addEventListener("pointerenter", prepare);
    preparationRow?.addEventListener("pointerdown", prepare, { passive: true });
    preparationRow?.addEventListener("focus", prepare);
    const ro = new ResizeObserver(() => {
      if (prepared) {
        loadImage();
        scheduleRender();
      }
    });
    window.addEventListener("resize", loadImage);
    ro.observe(host);
    return () => {
      disposed = true;
      bitmap?.close();
      preparationRow?.removeEventListener("pointerenter", prepare);
      preparationRow?.removeEventListener("pointerdown", prepare);
      preparationRow?.removeEventListener("focus", prepare);
      window.removeEventListener("resize", loadImage);
      if (image) {
        image.onload = null;
        image.onerror = null;
        image.removeAttribute("src");
      }
      clearTimeout(renderTimer);
      prepIo.disconnect();
      ro.disconnect();
    };
  }, [visual, title, paused, imageUrl, imageData, prepareNearRow]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || interaction !== "hold") return;
    let timer = 0;
    let pointer: { id: number; x: number; y: number } | null = null;
    let completed = false;
    const reset = () => {
      clearTimeout(timer);
      pointer = null;
      host.dataset.color = "false";
    };
    const down = (event: globalThis.PointerEvent) => {
      if (event.pointerType !== "touch" || !event.isPrimary) return;
      reset();
      completed = false;
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
      timer = window.setTimeout(() => {
        completed = true;
        host.dataset.color = "true";
      }, 350);
    };
    const move = (event: globalThis.PointerEvent) => {
      if (pointer?.id === event.pointerId && Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > 10) reset();
    };
    const end = (event: globalThis.PointerEvent) => {
      if (pointer?.id === event.pointerId) reset();
    };
    const click = (event: globalThis.MouseEvent) => {
      if (!completed || event.detail === 0) return;
      completed = false;
      event.preventDefault();
      event.stopPropagation();
    };
    const contextMenu = (event: Event) => {
      if (pointer || completed) event.preventDefault();
    };
    host.addEventListener("pointerdown", down, { passive: true });
    host.addEventListener("click", click, true);
    host.addEventListener("contextmenu", contextMenu);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", end, { passive: true });
    window.addEventListener("pointercancel", end, { passive: true });
    window.addEventListener("scroll", reset, { passive: true, capture: true });
    window.addEventListener("blur", reset);
    return () => {
      reset();
      host.removeEventListener("pointerdown", down);
      host.removeEventListener("click", click, true);
      host.removeEventListener("contextmenu", contextMenu);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      window.removeEventListener("scroll", reset, true);
      window.removeEventListener("blur", reset);
    };
  }, [interaction, visual, title, imageUrl, imageData]);

  function onPointer(event: PointerEvent<HTMLDivElement>) {
    const rect = hostRef.current?.getBoundingClientRect();
    if (!rect || !revealCanvasRef.current) return;
    revealCanvasRef.current.style.setProperty("--rx", `${event.clientX - rect.left}px`);
    revealCanvasRef.current.style.setProperty("--ry", `${event.clientY - rect.top}px`);
  }

  const unavailable = normalizeProjectVisual(visual) === "none" && !(imageData?.url || imageUrl);
  const unavailableLabel = locale === "id" ? "Pratinjau tidak tersedia" : "Preview unavailable";
  const imageLabel = unavailable ? `${title} — ${unavailableLabel}` : title;
  const toggleLabel = locale === "id" ? "Tampilkan warna" : "Reveal color";
  return <div ref={hostRef} role={interaction === "toggle" ? undefined : "img"} aria-label={interaction === "toggle" ? undefined : imageLabel} onPointerEnter={onPointer} onPointerMove={onPointer} className="project-pixel-group" data-color={colorVisible ? "true" : "false"} data-upload={imageUrl ? 'true' : undefined}>
    {interaction === "toggle" && <button type="button" className="project-pixel-toggle" aria-label={`${toggleLabel} — ${imageLabel}`} aria-pressed={colorVisible} onClick={() => setColorVisible(value => !value)} />}
    {unavailable && <span className="project-preview-unavailable mono">{unavailableLabel}</span>}
    <canvas ref={baseCanvasRef} className="project-pixel-canvas" aria-hidden="true" />
    <canvas ref={revealCanvasRef} className="project-pixel-canvas project-pixel-reveal" aria-hidden="true" />
    <span className="project-pixel-border" aria-hidden="true" />
  </div>;
}

export default function ProjectsSection({
  locale,
  paused,
  cmsProjects,
  totalProjectsCount,
}: {
  locale: Locale;
  paused: boolean;
  cmsProjects?: ProjectItemData[];
  totalProjectsCount?: number;
}) {
  const { navigateWithCurtain } = usePageTransition();
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const horizontal = useRef<gsap.core.Tween | null>(null);
  const copy = projectsCopy[locale];

  const renderedProjects: ProjectItemData[] = cmsProjects !== undefined
    ? cmsProjects
    : [];

  const allCount = totalProjectsCount !== undefined ? totalProjectsCount : renderedProjects.length;

  useEffect(() => {
    if (!root.current) return;
    const host = root.current;
    return scheduleMotionInit(() => {
      const media = gsap.matchMedia(host);
      if (!paused && renderedProjects.length > 0) {
        media.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
          const distance = () => {
            if (!track.current || !root.current) return 0;
            return Math.max(0, track.current.scrollWidth - root.current.clientWidth);
          };
          if (!track.current) return;
          const frames = host.querySelectorAll<HTMLElement>(".project-art-frame:not(.project-art-frame-upload)");
          primeGsapElements([track.current, ...frames]);
          const tween = gsap.to(track.current, {
            x: () => -distance(),
            ease: "none",
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: () => `+=${distance()}`,
              pin: true,
              scrub: true,
              invalidateOnRefresh: true,
              onUpdate: self => {
                const rounded = self.progress.toFixed(3);
                if (root.current && root.current.style.getPropertyValue("--projects-progress") !== rounded) {
                  root.current.style.setProperty("--projects-progress", rounded);
                }
              },
            },
          });
          horizontal.current = tween;
          frames.forEach(frame => {
            gsap.fromTo(frame, { xPercent: 6 }, { xPercent: -6, ease: "none", scrollTrigger: { trigger: frame.parentElement, containerAnimation: tween, start: "left right", end: "right left", scrub: true } });
          });
          return () => { horizontal.current = null; };
        });
      }
      let prevRootW = 0;
      const resize = new ResizeObserver(() => {
        const rw = root.current?.clientWidth ?? 0;
        const shouldRefresh = prevRootW > 0 && Math.abs(rw - prevRootW) > 4;
        prevRootW = rw;
        if (shouldRefresh) requestDebouncedScrollTriggerRefresh();
      });
      if (root.current) resize.observe(root.current);
      const onPreloaderDone = () => requestDebouncedScrollTriggerRefresh();
      window.addEventListener("portfolio:preloader-done", onPreloaderDone);
      window.addEventListener("portfolio:preloader-settled", onPreloaderDone);
      return () => {
        window.removeEventListener("portfolio:preloader-done", onPreloaderDone);
        window.removeEventListener("portfolio:preloader-settled", onPreloaderDone);
        resize.disconnect();
        horizontal.current?.scrollTrigger?.kill();
        horizontal.current?.kill();
        horizontal.current = null;
        media.revert();
      };
    }, 104);
  }, [paused, renderedProjects.length]);

  useEffect(() => {
    if (!root.current || paused) return;
    const host = root.current;
    return scheduleMotionInit(() => {
      const media = gsap.matchMedia(host);
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const isMob = typeof window !== "undefined" && window.innerWidth < 900;
        const chars = primeGsapElements(host.querySelectorAll<HTMLElement>(".projects-title-char"), { opacity: true, filter: !isMob });
        const tween = gsap.from(chars, {
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
        return observeViewportReveal(host, () => { tween.play(); });
      });
      return () => media.revert();
    }, 96);
  }, [locale, paused]);

  function revealFocused(event: FocusEvent<HTMLElement>) {
    if (!event.target.matches(":focus-visible")) return;
    const tween = horizontal.current;
    const trigger = tween?.scrollTrigger;
    if (!trigger || !track.current || !root.current) return;
    root.current.scrollLeft = 0;
    const article = event.currentTarget;
    const offset = Math.min(article.offsetLeft - 40, track.current.scrollWidth - root.current.clientWidth);
    const target = trigger.start + Math.max(0, offset);
    const bounds = article.getBoundingClientRect();
    if (bounds.left >= 0 && bounds.right <= root.current.clientWidth) return;
    window.scrollTo({ top: target, behavior: "instant" });
    tween.progress((target - trigger.start) / (trigger.end - trigger.start));
  }

  function navigateToProjects(url: string) {
    const reticle = document.querySelector<HTMLElement>(".pointer-reticle");
    if (reticle) {
      reticle.dataset.state = "";
      reticle.dataset.link = "false";
    }
    navigateWithCurtain(url, "up");
  }

  return <section ref={root} id="projects" className={`projects-section${paused || renderedProjects.length === 0 ? " projects-paused" : ""}`} aria-labelledby="projects-title" tabIndex={-1}>
      <div ref={track} className="projects-track">
        <div className="projects-intro">
          <div><div className="projects-label mono"><span aria-hidden="true">[ <b>03</b> / 04 ] · </span>{copy.work}</div>
            <h2 id="projects-title" className="projects-title display" aria-label={copy.title}>{copy.title.split(" ").map((word, i) => <span className="projects-title-word" aria-hidden="true" key={`${locale}-${i}`}>{[...word].map((letter, j) => <span className="projects-title-char" key={`${locale}-${j}`}>{letter}</span>)}{i < copy.title.split(" ").length - 1 && <span className="projects-title-char">&nbsp;</span>}</span>)}</h2>
          </div>
          <div className="projects-intro-bottom"><p>{copy.intro}</p><span className="projects-scroll mono">{copy.scroll} <ArrowRight size={14} aria-hidden="true" /></span></div>
        </div>
        {renderedProjects.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '400px', padding: '60px 40px', color: 'rgba(243, 242, 237, 0.45)', fontFamily: 'var(--font-geist-mono), monospace', fontSize: '13px' }}>
            <span>{locale === 'id' ? '[ Belum ada proyek yang dipublikasikan ]' : '[ No published projects available ]'}</span>
          </div>
        ) : (
          renderedProjects.map((project, index) => <article className="project-article" key={project.slug} onFocusCapture={revealFocused}>
            <div className="project-meta mono"><span><b>0{index + 1}</b> / 0{renderedProjects.length}</span><span>{project.kind}</span></div>
            <button className="project-cover" data-cursor={copy.view} onClick={() => navigateToProjects(`/projects?project=${project.slug}`)} aria-label={`${copy.details} — ${project.title}`}>
              <span className={`project-art-frame${project.imageUrl ? " project-art-frame-upload" : ""}`}>
                <ProjectPixelCover locale={locale} visual={project.visual} title={project.gallery?.[0]?.alt || project.title} paused={paused} imageUrl={project.imageUrl} imageData={project.gallery?.[0]} />
              </span>
            </button>
            <div className="project-caption"><h3>{project.title}</h3><div><p>{project.summary}</p>{project.technologies.length > 0 && <ul className="project-technologies mono" aria-label={copy.stack}>{project.technologies.map(tech => <li key={tech}>{tech}</li>)}</ul>}</div></div>
          </article>)
        )}
        <button className="projects-all" onClick={() => navigateToProjects("/projects")} onFocus={revealFocused}><span className="mono projects-all-count">{copy.count} <span className="projects-all-number">[{allCount}]</span></span><span className="projects-all-title display">{copy.all}<ArrowRight size={32} aria-hidden="true" /></span></button>
      </div>
    </section>;
}
