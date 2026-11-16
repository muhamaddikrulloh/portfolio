"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import gsap from "gsap";
import { observeViewportReveal, primeGsapElements, scheduleMotionInit } from "./motion-tokens";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import type { Locale } from "./intro-content";
import type { CertificateItemData } from "@/lib/cms-types";
import CertificatePdf from './certificate-pdf';
import "./certificates.css";

function CertificateArtwork({ number, id }: { number: number; id: boolean }) {
  return <svg className="certificate-artwork" viewBox="0 0 600 420" role="img" aria-label={`${id ? "Contoh artwork sertifikat" : "Sample certificate artwork"} ${number}`}>
    <rect width="600" height="420" fill="#f3f2ed" />
    <rect x="18" y="18" width="564" height="384" fill="none" stroke="#0b0b0b" strokeWidth="2" />
    <rect x="28" y="28" width="544" height="364" fill="none" stroke="#0b0b0b" strokeWidth="0.5" />
    <path d="M280 64h40v40h-40z" fill="#ff4d00" />
    <text x="300" y="148" textAnchor="middle" fill="#0b0b0b" fontFamily="serif" fontSize="37">{id ? "SERTIFIKAT" : "CERTIFICATE"}</text>
    <text x="300" y="179" textAnchor="middle" fill="#0b0b0b" fontFamily="monospace" fontSize="11" letterSpacing="3">{id ? "CONTOH ARTWORK" : "SAMPLE ARTWORK"}</text>
    <line x1="160" y1="225" x2="440" y2="225" stroke="#0b0b0b" />
    <text x="300" y="252" textAnchor="middle" fill="#0b0b0b" fontFamily="monospace" fontSize="11">{id ? "BUKAN KREDENSIAL ASLI" : "NOT AN ISSUED CREDENTIAL"}</text>
    <line x1="105" y1="325" x2="225" y2="325" stroke="#0b0b0b" />
    <line x1="375" y1="325" x2="495" y2="325" stroke="#0b0b0b" />
    <text x="300" y="367" textAnchor="middle" fill="#0b0b0b" fontFamily="monospace" fontSize="13">{String(number).padStart(2, "0")}</text>
  </svg>;
}

function CertificatePreview({ cert, detail = false }: { cert: CertificateItemData; detail?: boolean }) {
  const [failed, setFailed] = useState(false);
  const preview = cert.previewPages?.[0];
  const pdf = cert.fileMimeType === 'application/pdf' || /\.pdf(?:[?#]|$)/i.test(cert.fileUrl || '');
  if (pdf && (!preview || failed)) return <CertificatePdf url={cert.fileUrl!} title={cert.title} />;
  const image = !failed && preview ? preview : cert.fileImage;
  return <img src={image?.url || cert.fileUrl} srcSet={!failed ? image?.srcSet : undefined} sizes={detail ? '(max-width: 520px) calc(100vw - 90px), 430px' : '(max-width: 700px) 151px, 176px'} width={image?.width} height={image?.height} onError={() => setFailed(true)} alt={cert.title} loading={detail ? 'eager' : 'lazy'} decoding="async" className="certificate-artwork" style={{ objectFit: detail || pdf ? 'contain' : 'cover', width: '100%', height: '100%' }} />;
}

export default function CertificatesSection({
  locale,
  cmsCertificates,
}: {
  locale: Locale;
  cmsCertificates?: CertificateItemData[];
}) {
  const [selected, setSelected] = useState(0);
  const [opened, setOpened] = useState(false);
  const [paused, setPaused] = useState(false);
  const [front, setFront] = useState<number | null>(null);
  const [direction, setDirection] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const tilt = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const transferFocus = useRef(false);
  const rotation = useRef(0);
  const wakeRotation = useRef<(() => void) | null>(null);
  const target = useRef<number | null>(null);
  const velocity = useRef(0);
  const dragged = useRef(false);
  const gesture = useRef<{ x: number; y: number; last: number; time: number; horizontal: boolean } | null>(null);
  const detailStart = useRef<{ x: number; y: number } | null>(null);
  const id = locale === "id";

  const certList: CertificateItemData[] = cmsCertificates !== undefined
    ? cmsCertificates
    : [];

  const count = Math.max(1, certList.length);
  const step = 360 / count;
  const title = (index: number) => certList[index]?.title || `${id ? "Contoh sertifikat" : "Sample certificate"} ${String(index + 1).padStart(2, "0")}`;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!heading.current) return;
    const host = heading.current;
    return scheduleMotionInit(() => {
      const media = gsap.matchMedia(host);
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const isMob = typeof window !== "undefined" && window.innerWidth < 900;
        const chars = primeGsapElements(host.querySelectorAll<HTMLElement>(".experience-heading-character"), { opacity: true, filter: !isMob });
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
    }, 80);
  }, [locale]);

  useEffect(() => {
    const element = stage.current;
    const rotor = ring.current;
    if (!element || !rotor) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let inside = false;
    let steer = 0;
    let speed = 10;
    let scrollImpulse = 0;
    let currentTilt = 0;
    let lastScroll = window.scrollY;
    let lastScrollTime = performance.now();
    let previous = 0;
    let frame = 0;
    const cards = [...rotor.querySelectorAll<HTMLButtonElement>(".certificate-card")];
    let active = ((Math.round(-rotation.current / step) % cards.length) + cards.length) % cards.length;
    setFront(active);

    function startLoop() {
      if (!frame && visible && !document.hidden && !opened) {
        previous = performance.now();
        frame = requestAnimationFrame(draw);
      }
    }

    function visibilityChange() {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else {
        startLoop();
      }
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        startLoop();
      } else if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });
    observer.observe(element);

    function pointerMove(event: globalThis.PointerEvent) {
      if (event.pointerType !== "mouse") return;
      if (!(event.target instanceof Element) || !event.target.closest(".certificate-orbit")) { inside = false; return; }
      const bounds = element!.getBoundingClientRect();
      steer = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
      inside = true;
      startLoop();
    }
    function pointerLeave() { inside = false; }
    function scroll() {
      const now = performance.now();
      scrollImpulse = Math.max(-16, Math.min(16, -(window.scrollY - lastScroll) / Math.max(now - lastScrollTime, 1) * 6.4));
      lastScroll = window.scrollY;
      lastScrollTime = now;
      startLoop();
    }
    function draw(now: number) {
      frame = 0;
      const dt = Math.min((now - (previous || now)) / 1000, 0.048);
      previous = now;
      if (visible && !document.hidden && !opened) {
        if (target.current !== null) {
          rotation.current += (target.current - rotation.current) * (media.matches ? 1 : 1 - Math.exp(-dt * 8));
          if (Math.abs(target.current - rotation.current) < 0.01) { rotation.current = target.current; target.current = null; }
        } else if (!media.matches && !paused && !gesture.current && !cards.some(card => card.matches(":focus-visible"))) {
          speed += ((inside ? steer * 24 : 10) - speed) * (1 - Math.exp(-dt * 3));
          velocity.current *= Math.exp(-dt * 2.2);
          if (Math.abs(velocity.current) < 1) velocity.current = 0;
          rotation.current += (speed + velocity.current) * dt;
        }
        const nearest = ((Math.round(-rotation.current / step) % cards.length) + cards.length) % cards.length;
        if (nearest !== active) {
          transferFocus.current = cards[active] === document.activeElement;
          active = nearest;
          setFront(nearest);
        }
        scrollImpulse *= Math.exp(-dt * 3);
        currentTilt += ((media.matches ? 0 : scrollImpulse) - currentTilt) * (1 - Math.exp(-dt * 8));
        rotor!.style.transform = `rotateY(${rotation.current}deg)`;
        if (tilt.current) tilt.current.style.transform = `rotateX(${-6 + currentTilt}deg)`;
        cards.forEach((card, index) => {
          const angle = Math.abs(((index * step + rotation.current) % 360 + 540) % 360 - 180);
          card.style.setProperty("--depth-light", String(1 - 0.5 * (angle / 180) ** 1.6));
        });
        if (target.current !== null || Math.abs(scrollImpulse) > 0.01 || Math.abs(currentTilt) > 0.01 || gesture.current || (!media.matches && !paused && !cards.some(card => card.matches(":focus-visible")))) {
          frame = requestAnimationFrame(draw);
        }
      }
    }
    wakeRotation.current = startLoop;
    element.addEventListener("focusout", startLoop);
    media.addEventListener("change", startLoop);
    element.addEventListener("pointermove", pointerMove);
    element.addEventListener("pointerleave", pointerLeave);
    window.addEventListener("scroll", scroll, { passive: true });
    document.addEventListener("visibilitychange", visibilityChange);
    if (visible) startLoop();
    return () => {
      cancelAnimationFrame(frame);
      frame = 0;
      observer.disconnect();
      wakeRotation.current = null;
      element.removeEventListener("focusout", startLoop);
      media.removeEventListener("change", startLoop);
      element.removeEventListener("pointermove", pointerMove);
      element.removeEventListener("pointerleave", pointerLeave);
      window.removeEventListener("scroll", scroll);
      document.removeEventListener("visibilitychange", visibilityChange);
    };
  }, [opened, paused, step]);

  useEffect(() => {
    if (!transferFocus.current || front === null) return;
    transferFocus.current = false;
    ring.current?.querySelectorAll<HTMLButtonElement>(".certificate-card")[front]?.focus({ preventScroll: true });
  }, [front]);

  useEffect(() => {
    if (!opened) return;
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = overflow; };
  }, [opened]);

  useEffect(() => {
    if (!opened || !panel.current || reduced()) return;
    const animation = gsap.fromTo(panel.current,
      { rotateY: direction === 0 ? 180 : 0, x: direction * 160, scale: direction === 0 ? 0.5 : 1, opacity: 0 },
      { rotateY: 0, x: 0, scale: 1, opacity: 1, duration: 0.85, ease: "expo.out", clearProps: "transform,opacity" });
    return () => { animation.kill(); };
  }, [opened, selected, direction]);

  function face(index: number) {
    const desired = -index * step;
    target.current = rotation.current + ((desired - rotation.current) % 360 + 540) % 360 - 180;
    velocity.current = 0;
    wakeRotation.current?.();
  }
  function move(delta: number) {
    const nearest = Math.round(-(target.current ?? rotation.current) / step);
    face(((nearest + delta) % certList.length + certList.length) % certList.length);
  }
  function moveDetail(delta: number) {
    setDirection(delta);
    setSelected(current => (current + delta + certList.length) % certList.length);
  }
  function close() {
    const finish = () => dialog.current?.close();
    if (reduced() || !panel.current) finish();
    else gsap.to(panel.current, { rotateY: 180, scale: 0.5, opacity: 0, duration: 0.45, ease: "power2.in", overwrite: true, onComplete: finish });
  }
  function endDrag(event: PointerEvent<HTMLDivElement>, cancelled = false) {
    if (!gesture.current) return;
    gesture.current = null;
    velocity.current = cancelled || reduced() || paused ? 0 : Math.max(-260, Math.min(260, velocity.current));
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return <section className="certificates" id="certificates" aria-labelledby="certificates-title">
    <div className="certificates-heading"><h2 ref={heading} id="certificates-title"><span className="sr-only">{id ? "Sertifikat" : "Certificates"}</span><span className="experience-title-mask" aria-hidden="true">{[...(id ? "Sertifikat" : "Certificates")].map((char, index) => <span className="experience-heading-character" key={`${locale}-${index}`}>{char}</span>)}</span></h2></div>
    {certList.length === 0 ? (
      <div style={{ padding: '60px 40px', textAlign: 'center', color: 'rgba(243, 242, 237, 0.45)', fontFamily: 'var(--font-geist-mono), monospace', fontSize: '13px' }}>
        <span>{id ? '[ Belum ada sertifikat yang dipublikasikan ]' : '[ No published certificates available ]'}</span>
      </div>
    ) : (
      <div ref={stage} className="certificates-stage" role="region" tabIndex={0} aria-roledescription={id ? "karusel" : "carousel"} aria-label={id ? "Galeri sertifikat" : "Certificate gallery"} aria-describedby="certificates-keyboard-hint" data-lenis-prevent-touch
      onPointerDown={event => {
        if (!event.isPrimary || event.button !== 0) return;
        gesture.current = { x: event.clientX, y: event.clientY, last: event.clientX, time: event.timeStamp, horizontal: false };
        dragged.current = false;
        velocity.current = 0;
        target.current = null;
        wakeRotation.current?.();
      }}
      onPointerMove={event => {
        const current = gesture.current;
        if (!current) return;
        const dx = event.clientX - current.x;
        if (!current.horizontal) {
          if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(event.clientY - current.y)) return;
          current.horizontal = true;
          target.current = null;
          dragged.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
        }
        const delta = (event.clientX - current.last) * 0.28;
        rotation.current += delta;
        velocity.current = delta / Math.max(event.timeStamp - current.time, 1) * 1000;
        current.last = event.clientX;
        current.time = event.timeStamp;
      }} onPointerUp={event => endDrag(event)} onPointerCancel={event => endDrag(event, true)} onLostPointerCapture={event => { if (event.target === event.currentTarget) gesture.current = null; }}
      onKeyDown={event => {
        if (event.key === " " && event.target === event.currentTarget) {
          event.preventDefault();
          if (!event.repeat) { velocity.current = 0; setPaused(value => !value); }
          return;
        }
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight" && event.key !== "Home" && event.key !== "End") return;
        event.preventDefault();
        if (event.key === "Home" || event.key === "End") face(event.key === "Home" ? 0 : certList.length - 1);
        else move(event.key === "ArrowRight" ? 1 : -1);
      }}>
      <span id="certificates-keyboard-hint" className="sr-only">{id ? "Tekan Spasi untuk menjeda atau melanjutkan rotasi; gunakan tombol panah, Home, atau End untuk memilih sertifikat." : "Press Space to pause or resume rotation; use arrow keys, Home, or End to select a certificate."}</span>
      <span className="sr-only" role="status">{paused ? (id ? "Rotasi dijeda" : "Rotation paused") : ""}</span>
      <div className="certificates-perspective"><div ref={tilt} className="certificates-tilt"><div ref={ring} className="certificates-ring">
        {certList.map((cert, index) => <div className="certificate-orbit" key={cert.id} style={{ "--angle": `${index * step}deg` } as CSSProperties}>
          <button type="button" className="certificate-card crosshair" aria-haspopup="dialog" disabled={front !== index} onClick={event => {
            if (front !== index || (dragged.current && event.detail !== 0)) return;
            opener.current = event.currentTarget;
            setDirection(0);
            setSelected(index);
            setOpened(true);
            dialog.current?.showModal();
          }}>
            <span className="certificate-preview" aria-hidden="true">
              {cert.fileUrl ? (
                <CertificatePreview key={cert.fileUrl} cert={cert} />
              ) : (
                <CertificateArtwork number={index + 1} id={id} />
              )}
            </span>
            <span className="certificate-card-title">{title(index)}</span>
            <span className="certificate-issuer">{cert.issuer}</span>
            <span className="certificate-card-action">{id ? "Buka" : "Reveal"} <ArrowRight size={14} aria-hidden="true" /></span>
          </button>
          <div className="certificate-card-back crosshair" aria-hidden="true"><svg viewBox="0 0 212 318" fill="none">
            <rect x="14" y="14" width="184" height="290" stroke="currentColor" strokeOpacity=".22" />
            <path d="M14 14L198 304M198 14L14 304M106 14V304M14 159H198" stroke="currentColor" strokeOpacity=".12" />
            <circle cx="106" cy="159" r="56" fill="#0b0b0b" stroke="currentColor" strokeOpacity=".35" />
            <path d="M106 115L144 159L106 203L68 159Z" fill="#0b0b0b" stroke="currentColor" strokeOpacity=".55" />
            <circle cx="106" cy="159" r="3" fill="currentColor" />
          </svg></div>
        </div>)}
      </div></div></div>
    </div>
    )}
    <dialog ref={dialog} className="certificate-dialog" aria-labelledby="certificate-dialog-title" aria-describedby="certificate-disclaimer" data-lenis-prevent onCancel={event => { event.preventDefault(); close(); }} onClose={() => { setOpened(false); opener.current?.focus({ preventScroll: true }); }} onKeyDown={event => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); moveDetail(event.key === "ArrowRight" ? 1 : -1); }
    }} onClick={event => { if (event.target === event.currentTarget) close(); }}>
      <button type="button" className="certificate-close" aria-label={id ? "Tutup sertifikat" : "Close certificate"} onClick={close}>×</button>
      <div ref={panel} className="certificate-dialog-inner crosshair">
        <div className="certificate-detail-art" onPointerDown={event => { detailStart.current = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerCancel={() => { detailStart.current = null; }} onPointerUp={event => {
          const start = detailStart.current;
          detailStart.current = null;
          if (start && Math.abs(event.clientX - start.x) > 90 && Math.abs(event.clientX - start.x) > Math.abs(event.clientY - start.y)) moveDetail(event.clientX < start.x ? 1 : -1);
        }}>
          {opened && certList[selected]?.fileUrl ? (
            <CertificatePreview key={certList[selected].fileUrl} cert={certList[selected]} detail />
          ) : (
            <CertificateArtwork number={selected + 1} id={id} />
          )}
        </div>
        <div className="certificate-detail-copy">
          <h3 id="certificate-dialog-title">{title(selected)}{certList[selected]?.credentialUrl && (
            <a href={certList[selected].credentialUrl} target="_blank" rel="noopener noreferrer" aria-label={id ? `Verifikasi ${title(selected)}` : `Verify ${title(selected)}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, marginInlineStart: 8, verticalAlign: 'middle', position: 'relative', top: '-2px' }}>
              <ExternalLink size={16} aria-hidden="true" />
            </a>
          )}</h3>
          <p id="certificate-disclaimer">
            {certList[selected]?.description || (id
              ? "Contoh artwork untuk pratinjau. Bukan bukti sertifikasi; judul, penerbit, tahun dan dokumen asli belum diberikan."
              : "Sample artwork for preview. Not proof of certification; actual title, issuer, year and document have not been supplied.")}
          </p>
          <dl className="certificate-metadata">
            <div><dt>{id ? "Penerbit" : "Issuer"}</dt><dd>{certList[selected]?.issuer || "—"}</dd></div>
            <div><dt>{id ? "Tahun" : "Year"}</dt><dd>{certList[selected]?.year || "—"}</dd></div>
            <div>
              <dt>{id ? "ID Kredensial" : "Credential ID"}</dt>
              <dd>{certList[selected]?.credentialId || '—'}</dd>
            </div>
          </dl>
        </div>
      </div>
      <div className="certificates-controls certificate-detail-controls"><button type="button" onClick={() => moveDetail(-1)} aria-label={id ? "Sertifikat sebelumnya" : "Previous certificate"}><ArrowLeft size={18} /></button><span aria-live="polite">{String(selected + 1).padStart(2, "0")} / {certList.length}</span><button type="button" onClick={() => moveDetail(1)} aria-label={id ? "Sertifikat berikutnya" : "Next certificate"}><ArrowRight size={18} /></button></div>
    </dialog>
  </section>;
}
