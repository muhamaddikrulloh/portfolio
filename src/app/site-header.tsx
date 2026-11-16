"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ArrowUpRight, X } from "lucide-react";
import { identity, introCopy } from "./intro-content";
import { motionTokens } from "./motion-tokens";
import { useLocale } from "./locale-provider";
import { usePathname } from "next/navigation";
import { usePageTransition } from "./page-transition";

gsap.registerPlugin(CustomEase);
const menuRevealEase = CustomEase.create("hero-menu-reveal", motionTokens.ease.curtain);

export default function SiteHeader() {
  const { locale, switchLanguage } = useLocale();
  const copy = introCopy[locale];
  const pathname = usePathname();
  const { navigateWithCurtain } = usePageTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);
  const afterMenuClose = useRef<(() => void) | null>(null);
  const navigation = [
    { label: copy.aboutLabel, href: "/#about" },
    { label: copy.experience, href: "/#experience" },
    { label: copy.projects, href: "/#projects" },
    { label: copy.contact, href: "/#contact" },
  ];

  const currentTab = pathname === "/cv" ? "" : pathname.startsWith("/projects") ? "/#projects" : activeSection;

  useEffect(() => {
    if (pathname !== "/") return;
    let scheduled = false;
    function update() {
      scheduled = false;
      if (window.scrollY < 80 && !window.location.hash) {
        setActiveSection(curr => curr ? "" : curr);
        return;
      }
      let current = "";
      for (const id of ["about", "experience", "projects", "contact"]) {
        const section = document.getElementById(id);
        const anchor = section?.parentElement?.classList.contains("pin-spacer") ? section.parentElement : section;
        if (anchor && anchor.getBoundingClientRect().top <= 100) current = `/#${id}`;
      }
      setActiveSection(curr => curr !== current ? current : curr);
    }
    function onScroll() {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(update);
      }
    }
    const raf = requestAnimationFrame(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const media = matchMedia("(min-width: 900px)");
    const close = () => { if (media.matches) dialog.current?.close(); };
    media.addEventListener("change", close);
    return () => { document.documentElement.style.overflow = overflow; media.removeEventListener("change", close); };
  }, [menuOpen]);

  function openMenu() {
    if (!dialog.current || dialog.current.open) return;
    closing.current = false;
    dialog.current.showModal();
    setMenuOpen(true);
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.fromTo(dialog.current.querySelector(".menu-panel"), { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: motionTokens.duration.overlayCurtain, ease: menuRevealEase, overwrite: true });
      gsap.fromTo(dialog.current.querySelectorAll(".menu-links > *, .menu-bottom"), { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: motionTokens.duration.overlayItems, delay: 0.22, stagger: 0.07, ease: "expo.out", clearProps: "transform,opacity", overwrite: true });
    }
  }

  function closeMenu(afterClose?: () => void) {
    if (closing.current || !dialog.current?.open) return;
    closing.current = true;
    const finish = () => { afterMenuClose.current = afterClose ?? null; dialog.current?.close(); closing.current = false; };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { finish(); return; }
    gsap.killTweensOf(dialog.current.querySelectorAll(".menu-links > *, .menu-bottom"));
    gsap.to(dialog.current.querySelector(".menu-panel"), { clipPath: "inset(0% 0% 100% 0%)", duration: motionTokens.duration.overlayCurtain, ease: menuRevealEase, overwrite: true, onComplete: finish });
  }

  function navigate(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const href = event.currentTarget.getAttribute("href")!;
    const hash = event.currentTarget.hash;
    if (href === "/") {
      event.preventDefault();
      const go = () => {
        if (pathname === "/") {
          window.__portfolioTargetHash = "";
          history.pushState(null, "", "/");
          document.getElementById("introduction")?.focus({ preventScroll: true });
          window.dispatchEvent(new CustomEvent("portfolio:navigate", { detail: 0 }));
          window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
        } else {
          navigateWithCurtain("/", "down");
        }
      };
      if (dialog.current?.open) closeMenu(go); else go();
      return;
    }
    if (href === "/cv" || href === "/projects") {
      if (pathname === href) {
        if (dialog.current?.open) closeMenu();
        return;
      }
      event.preventDefault();
      const go = () => navigateWithCurtain(href, "up");
      if (dialog.current?.open) closeMenu(go); else go();
      return;
    }
    if (hash) {
      event.preventDefault();
      const go = () => {
        if (pathname !== "/") {
          navigateWithCurtain(href, "down");
          return;
        }
        const target = document.getElementById(hash.slice(1));
        if (!target) return;
        window.__portfolioTargetHash = "";
        history.pushState(null, "", href);
        target.focus({ preventScroll: true });
        const anchor = target.parentElement?.classList.contains("pin-spacer") ? target.parentElement : target;
        const top = anchor.getBoundingClientRect().top + window.scrollY;
        window.dispatchEvent(new CustomEvent("portfolio:smooth-scroll", { detail: top }));
        window.scrollTo({ top, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
      };
      if (dialog.current?.open) closeMenu(go); else go();
    }
  }

  const language = (
    <button className="language-switch" onClick={switchLanguage} aria-label={`EN ID — ${copy.language}`} suppressHydrationWarning>
      <span aria-hidden="true" className={locale === "en" ? "selected" : ""} suppressHydrationWarning>EN</span>
      <span aria-hidden="true" className={locale === "id" ? "selected" : ""} suppressHydrationWarning>ID</span>
    </button>
  );
  const wordmark = <Link className="wordmark" href="/" onClick={navigate}>MUHAMAD DIKRUULOH</Link>;
  return <>
    <a className="skip-link" href="#main-content">{copy.skip}</a>
    <header className="site-header"><nav className="header-inner" aria-label={copy.navigation}>
      {wordmark}
      <div className="desktop-links">
        <div className="nav-group">{navigation.slice(0, 2).map((item, i) => <Link key={item.href} href={item.href} aria-current={currentTab === item.href ? "location" : undefined} onClick={navigate}><sup>0{i + 1}</sup>{item.label}</Link>)}</div>
        <Link className="monogram" href="/" onClick={navigate} aria-label={`${identity.mark} — ${identity.name}`}>{identity.mark}</Link>
        <div className="nav-group">{navigation.slice(2).map((item, i) => <Link key={item.href} href={item.href} aria-current={currentTab === item.href ? "location" : undefined} onClick={navigate}><sup>0{i + 3}</sup>{item.label}</Link>)}</div>
      </div>
      <Link className="mobile-monogram monogram" href="/" onClick={navigate} aria-label={`${identity.mark} — ${identity.name}`}>{identity.mark}</Link>
      <div className="header-controls">{language}<button ref={menuButton} className="menu-button" aria-haspopup="dialog" aria-controls="mobile-menu" aria-expanded={menuOpen} onClick={openMenu}>{copy.menu}</button></div>
    </nav></header>
    <dialog ref={dialog} id="mobile-menu" className="mobile-menu" aria-label={copy.navigation} onCancel={event => { event.preventDefault(); closeMenu(); }} onClose={() => { setMenuOpen(false); const afterClose = afterMenuClose.current; afterMenuClose.current = null; if (afterClose) afterClose(); else menuButton.current?.focus({ preventScroll: true }); }} onKeyDown={event => {
      if (event.key !== "Tab") return;
      const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')];
      const first = controls[0]; const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
      <div className="menu-heading">{wordmark}<span className="monogram" aria-hidden="true">{identity.mark}</span><div className="header-controls">{language}<button autoFocus aria-label={copy.close} onClick={() => closeMenu()}><X size={14} aria-hidden="true" /></button></div></div>
      <div className="menu-panel"><div className="menu-links">{navigation.map((item, i) => <Link key={item.href} href={item.href} aria-current={currentTab === item.href ? "location" : undefined} onClick={navigate}>{item.label}<sup>0{i + 1}</sup></Link>)}</div>
      <div className="menu-bottom"><div className="menu-shortcuts"><Link className="button button-secondary" href="/projects" onClick={navigate}>{copy.projects}</Link><Link className="button button-secondary" href="/cv" onClick={navigate}>{locale === "id" ? "Lihat CV" : "View CV"}<ArrowUpRight size={14} aria-hidden="true" /></Link></div><p className="menu-identity">{identity.name}</p><p className="menu-profile mono">{copy.role}<br />{copy.engineeringApproach}</p></div></div>
    </dialog>
  </>;
}
