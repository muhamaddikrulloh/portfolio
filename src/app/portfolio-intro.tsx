"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowDown, ArrowRight, ArrowUpRight, Download, Pause, Play } from "lucide-react";
import { useLocale } from "./locale-provider";
import Link from "next/link";
import { usePageTransition } from "./page-transition";
import HeroVisual from "./hero-visual";
import HeroPortrait from "./hero-portrait";
import HeroDotField from "./hero-dot-field";
import PillarsSection from "./pillars-section";
import SkillsSection from "./skills-section";
import ExperienceSection from "./experience-section";
import CertificatesSection from "./certificates-section";
import ProjectsSection from "./projects-section";
import ContactSection from "./contact-section";
import { identity, introCopy } from "./intro-content";
import { useIntroMotion } from "./use-intro-motion";
import type { PortfolioBundle } from "@/lib/cms-types";

function MetadataText({ children }: { children: string }) {
  return (
    <span className="metadata-line">
      <span className="sr-only">{children}</span>
      <span aria-hidden="true">
        {[...children].map((letter, index) => (
          <span className="metadata-character" key={`${children}-${index}`}>
            {letter === " " ? "\u00a0" : letter}
          </span>
        ))}
      </span>
    </span>
  );
}

export default function PortfolioIntro({
  initialBundle,
}: {
  initialBundle?: { en: PortfolioBundle; id: PortfolioBundle };
}) {
  const { locale } = useLocale();
  const { navigateWithCurtain } = usePageTransition();
  const [paused, setPaused] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const clock = useRef<HTMLTimeElement>(null);
  const lenis = useIntroMotion(root, locale, paused);
  const copy = introCopy[locale];
  const cms = initialBundle ? initialBundle[locale] : null;
  const about = cms?.about;
  const pdfUrl = cms?.resume?.pdfUrl;
  const downloadUrl = pdfUrl && /^\/media\/[^/?#\\\s]+\.pdf(?:\?[^#\\\s]*)?$/i.test(pdfUrl) ? pdfUrl : null;

  const aboutLabel = about?.header ?? "";
  const aboutHeading = about?.heading ?? "";
  const aboutLead = about?.lead ?? "";
  const aboutBody = about?.bodyPrimary ?? "";
  const aboutBodySecondary = about?.bodySecondary ?? "";
  const profileLabel = about?.profileHeading ?? "";
  const profileRows = about?.infoRows && about.infoRows.length > 0 ? about.infoRows : [];

  useEffect(() => {
    if (typeof history !== "undefined" && "scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    const targetHash = window.__portfolioTargetHash || window.location.hash;
    window.__portfolioTargetHash = "";
    if (!targetHash || targetHash === "#introduction") {
      const frame = requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "instant" });
        lenis.current?.scrollTo(0, { immediate: true, force: true });
      });
      return () => cancelAnimationFrame(frame);
    }
    if (window.location.hash !== targetHash) {
      history.replaceState(null, "", `/${targetHash}`);
    }
    let cancelled = false;
    const cancel = () => { cancelled = true; };
    window.addEventListener("wheel", cancel, { passive: true, once: true });
    window.addEventListener("touchstart", cancel, { passive: true, once: true });

    const syncToHash = () => {
      if (cancelled) return;
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
      const target = document.getElementById(targetHash.slice(1));
      if (!target) return;
      target.focus({ preventScroll: true });
      const anchor = target.parentElement?.classList.contains("pin-spacer") ? target.parentElement : target;
      const top = Math.max(0, anchor.getBoundingClientRect().top + window.scrollY);
      window.scrollTo({ top, behavior: "instant" });
      window.dispatchEvent(new CustomEvent("portfolio:restore-scroll", { detail: top }));
      ScrollTrigger.update();
    };

    const frame = requestAnimationFrame(syncToHash);
    const timers = [80, 220, 500].map(delay => setTimeout(syncToHash, delay));
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
      window.removeEventListener("wheel", cancel);
      window.removeEventListener("touchstart", cancel);
    };
  }, [lenis]);

  useEffect(() => {
    let formatter: Intl.DateTimeFormat | null = null;
    function update() {
      if (!clock.current) return;
      if (!formatter) {
        formatter = new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-GB", {
          timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
        });
      }
      const now = new Date();
      clock.current.dateTime = now.toISOString();
      clock.current.textContent = formatter.format(now).replaceAll(".", ":");
    }
    const initTimer = setTimeout(update, 60);
    const timer = setInterval(update, 1000);
    return () => {
      clearTimeout(initTimer);
      clearInterval(timer);
    };
  }, [locale]);

  function navigate(event: MouseEvent<HTMLAnchorElement>) {
    const hash = event.currentTarget.hash;
    const target = document.getElementById(hash.slice(1));
    if (!target || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const go = () => {
      if (location.hash !== hash) history.pushState(null, "", hash);
      target.focus({ preventScroll: true });
      const targetTop = target.getBoundingClientRect().top + window.scrollY;
      if (lenis.current) lenis.current.scrollTo(targetTop);
      else window.scrollTo({ top: targetTop, behavior: "instant" });
    };
    go();
  }

  return <div ref={root} data-motion={paused ? "off" : "on"}>
    <main id="main-content" tabIndex={-1}>
        <section className="hero" id="introduction" tabIndex={-1} aria-labelledby="hero-title">
          <HeroDotField paused={paused} />
          <HeroPortrait paused={paused} alt={copy.portraitAlt} label={copy.portraitAction} hint={copy.portraitHint} />
        <div className="hero-promo"><a href={identity.github}><span className="promo-mark" aria-hidden="true">{identity.mark}</span><span>{copy.promo}</span><span className="promo-action">GitHub <ArrowRight size={14} aria-hidden="true" /></span></a></div>
        <div className="hero-metadata mono">
          <p><MetadataText>{identity.givenName.toUpperCase()}</MetadataText><MetadataText>{identity.familyName.toUpperCase()}</MetadataText></p>
            <p><MetadataText>{copy.developmentFocusLabel}</MetadataText><MetadataText>{copy.developmentFocus}</MetadataText></p>
            <p><MetadataText>SUKABUMI</MetadataText><MetadataText>{locale === "en" ? "WEST JAVA • INDONESIA" : "JAWA BARAT • INDONESIA"}</MetadataText></p>
            <p className="clock"><MetadataText>{copy.clock}</MetadataText><span className="metadata-line"><time ref={clock}>--:--:--</time></span></p>
        </div>
        <button className="motion-control" aria-label={paused ? copy.resume : copy.pause} title={paused ? copy.resume : copy.pause} aria-pressed={paused} onClick={() => setPaused(!paused)}><span className="motion-control-icon">{paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}</span></button>
        <div className="hero-layout">
          <div className="hero-heading">
            <p className="eyebrow mono"><span className="status-light" aria-hidden="true" />{copy.eyebrow}</p>
            <h1 id="hero-title" aria-label={copy.headlineLabel}>
              {copy.headline.map((line, i) => <span className={`hero-line ${i === 1 ? "outline-line" : ""}`} key={`${locale}-${i}`} aria-hidden="true"><span className="hero-line-inner">{[...line].map((letter, index) => <span className="hero-character" key={index}>{letter === " " ? "\u00a0" : letter}</span>)}</span></span>)}
            </h1>
          </div>
          <div className="hero-summary">
              <p className="hero-copy">{copy.description}</p>
            <div className="hero-actions"><a className="button button-secondary" href="#projects" onClick={navigate}>{copy.seeProjects}</a><a className="button button-primary" href="#contact" onClick={navigate}>{copy.getInTouch}<ArrowUpRight size={14} aria-hidden="true" /></a></div>
          </div>
        </div>
        <div className="hero-bottom mono"><a href="#manifesto" onClick={navigate}>{copy.scroll}<ArrowDown size={14} aria-hidden="true" /></a></div>
      </section>
      <section id="manifesto" className="manifesto" tabIndex={-1} aria-label={copy.manifesto}>
        <HeroVisual paused={paused} variant="band" />
        <p className="sr-only">{copy.ticker.join(". ")}.</p>
        <div className="ticker-window" aria-hidden="true"><div className="ticker-track">{[0, 1].map(group => <div className="ticker-group" key={group}>{[0, 1].map(repeat => copy.ticker.map(word => <span className="ticker-word" key={`${repeat}-${word}`}><span>{word}</span><span className="ticker-star">✳</span></span>))}</div>)}</div></div>
        <p className="manifesto-caption mono">{copy.statement}</p>
      </section>
      <section id="about" className="about" tabIndex={-1} aria-labelledby="about-title">
        <div className="about-header">
          <div className="about-eyebrow label">
            <span className="eyebrow-line" aria-hidden="true" />
            <span aria-hidden="true" className="eyebrow-index">[ <span className="highlight">01</span> / 04 ]</span>
            <span aria-hidden="true" className="eyebrow-dot">·</span>
            <span>{aboutLabel || (locale === 'id' ? 'Tentang' : 'About')}</span>
          </div>
          <h2 id="about-title" className="about-heading display">
            <span className="sr-only">{aboutHeading || (locale === 'id' ? '[ Belum ada judul ]' : '[ No heading ]')}</span>
            <span aria-hidden="true" className="about-heading-mask">
              {[...(aboutHeading || (locale === 'id' ? '[ Belum ada judul ]' : '[ No heading ]'))].map((char, index) => (
                <span className="about-char inline-block will-change-transform" key={`${locale}-${index}`}>
                  {char === " " ? "\u00a0" : char}
                </span>
              ))}
            </span>
          </h2>
        </div>

        <div className="about-grid">
          <div className="about-editorial-col">
            {aboutLead ? (
              <p className="about-lead">
                <span className="sr-only">{aboutLead}</span>
                <span aria-hidden="true">
                  {aboutLead.split(" ").map((word, index) => (
                    <span key={`${locale}-${index}`} className="about-word" data-word={word} />
                  ))}
                </span>
              </p>
            ) : (
              <p className="about-lead" style={{ color: 'rgba(243, 242, 237, 0.45)', fontSize: '14px' }}>
                {locale === 'id' ? '[ Belum ada teks pembuka tentang ]' : '[ No about overview available ]'}
              </p>
            )}
            {(aboutBody || aboutBodySecondary) && (
              <>
                <div id="about-more" className={`about-more ${aboutExpanded ? "expanded" : ""}`}>
                  <div className="about-more-inner">
                    {aboutBody && <p className="about-reveal about-body">{aboutBody}</p>}
                    {aboutBodySecondary && <p className="about-reveal about-body">{aboutBodySecondary}</p>}
                  </div>
                </div>
                <button
                  type="button"
                  aria-expanded={aboutExpanded}
                  aria-controls="about-more"
                  className="about-disclosure-button label"
                  onClick={() => setAboutExpanded(curr => !curr)}
                >
                  <span>{aboutExpanded ? copy.aboutLess : copy.aboutMore}</span>
                </button>
              </>
            )}
          </div>

          <aside className="about-reveal profile-col" aria-label={profileLabel || copy.profileLabel}>
            <div className="crosshair profile-box">
              <p className="label profile-heading">{profileLabel || copy.profileLabel}</p>
              <div className="profile-rows">
                {profileRows.length === 0 ? (
                  <div style={{ padding: '16px 0', color: 'rgba(243, 242, 237, 0.45)', fontSize: '12px' }}>
                    <span>{locale === 'id' ? '[ Belum ada baris profil ]' : '[ No profile rows available ]'}</span>
                  </div>
                ) : (
                  profileRows.map((row, index) => (
                    <div className="profile-row font-mono" key={`${row.label}-${index}`}>
                      <span className="profile-label">{row.label}</span>
                      <span className="profile-val">{row.value}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="profile-actions">
                <Link className="btn-solid" href="/cv" onClick={event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); navigateWithCurtain("/cv", "up"); }}>
                  <span>{locale === "id" ? "Lihat resume" : "View resume"}</span>
                  <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
                {downloadUrl ? (
                  <a className="btn-ghost" href={downloadUrl} download>
                    <span>{locale === "id" ? "Unduh resume" : "Download resume"}</span>
                    <Download size={14} aria-hidden="true" />
                  </a>
                ) : (
                  <span className="btn-ghost" aria-disabled="true">{locale === "id" ? "PDF resume belum tersedia" : "Resume PDF unavailable"}</span>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>
      <PillarsSection locale={locale} paused={paused} />
      <SkillsSection locale={locale} paused={paused} cmsSkills={cms?.skills} />
      <ExperienceSection locale={locale} paused={paused} cmsExperience={cms?.experience} />
      <CertificatesSection locale={locale} cmsCertificates={cms?.certificates} />
      <ProjectsSection locale={locale} paused={paused} cmsProjects={cms?.selectedProjects} totalProjectsCount={cms?.allProjects.length} />
      <ContactSection locale={locale} paused={paused} cmsContact={cms?.contact} />
    </main>
  </div>;
}
