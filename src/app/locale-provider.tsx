"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { identity, introCopy, type Locale } from "./intro-content";

gsap.registerPlugin(ScrollTrigger);

type Position = { id: string; offset: number; progress: number | null };
const LocaleContext = createContext<{ locale: Locale; switchLanguage: () => void }>({ locale: "en", switchLanguage: () => {} });

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  const pending = useRef<Position | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem("portfolio-locale"); } catch { return; }
    if (saved !== "en" && saved !== "id") return;
    const preferred = saved;
    const frame = requestAnimationFrame(() => setLocale(preferred));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    const prefix = pathname === "/cv" ? "CV — " : pathname.startsWith("/projects") ? `${introCopy[locale].projects} — ` : "";
    document.title = `${prefix}${identity.name} — ${introCopy[locale].role}`;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const routeDescription = pathname === "/projects"
      ? locale === "id"
        ? "Jelajahi arsip aplikasi web, aplikasi mobile, dan eksperimen interaktif yang dibangun oleh Muhamad Dikrulloh."
        : "Explore the complete archive of web applications, mobile apps, and interactive experiments built by Muhamad Dikrulloh."
      : pathname === "/cv"
        ? locale === "id"
          ? "Curriculum Vitae Muhamad Dikrulloh — Pengembang Web & Mobile. Pendidikan, keterampilan teknis, pengalaman profesional, dan sertifikasi terverifikasi."
          : "Curriculum Vitae of Muhamad Dikrulloh — Web & Mobile Developer. Education, technical skills, professional experience, and verified certifications."
        : `${identity.name}. ${introCopy[locale].description}`;
    if (description) description.content = routeDescription;
  }, [locale, pathname]);

  useEffect(() => {
    function syncLanguage(event: StorageEvent) {
      if (event.key === "portfolio-locale" && (event.newValue === "en" || event.newValue === "id")) setLocale(event.newValue);
    }
    window.addEventListener("storage", syncLanguage);
    return () => window.removeEventListener("storage", syncLanguage);
  }, []);

  useLayoutEffect(() => {
    const position = pending.current;
    if (!position) return;
    pending.current = null;
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    const section = document.getElementById(position.id);
    if (!section) return;
    const trigger = ScrollTrigger.getAll().find(item => item.pin === section);
    const anchor = section.parentElement?.classList.contains("pin-spacer") ? section.parentElement : section;
    const top = position.progress !== null && trigger
      ? trigger.start + position.progress * (trigger.end - trigger.start)
      : anchor.getBoundingClientRect().top + window.scrollY + position.offset;
    window.scrollTo({ top, behavior: "instant" });
    window.dispatchEvent(new CustomEvent("portfolio:restore-scroll", { detail: top }));
    ScrollTrigger.update();
  }, [locale]);

  function switchLanguage() {
    const sections = [...document.querySelectorAll<HTMLElement>("main section[id], footer[id], main[id]")];
    let selected = sections[0];
    for (const section of sections) {
      const anchor = section.parentElement?.classList.contains("pin-spacer") ? section.parentElement : section;
      if (anchor.getBoundingClientRect().top <= 100) selected = section;
    }
    if (selected) {
      const trigger = ScrollTrigger.getAll().find(item => item.pin === selected && item.isActive);
      const anchor = selected.parentElement?.classList.contains("pin-spacer") ? selected.parentElement : selected;
      pending.current = { id: selected.id, offset: -anchor.getBoundingClientRect().top, progress: trigger ? trigger.progress : null };
    }
    const next = locale === "en" ? "id" : "en";
    setLocale(next);
    try { localStorage.setItem("portfolio-locale", next); } catch { return; }
  }

  return <LocaleContext.Provider value={{ locale, switchLanguage }}>{children}</LocaleContext.Provider>;
}

export function useLocale() { return useContext(LocaleContext); }
