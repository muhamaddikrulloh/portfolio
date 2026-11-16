"use client";

import { useRef, useState } from "react";
import type { ProjectImageData } from "@/lib/cms-types";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Download, FileText, Mail, MapPin, Printer } from "lucide-react";
import { identity, introCopy } from "@/app/intro-content";
import { useLocale } from "@/app/locale-provider";
import { usePageTransition } from "@/app/page-transition";
import "./cv.css";

export default function CvClient({ activePdfUrl, previewPages = [] }: { activePdfUrl?: string | null; previewPages?: ProjectImageData[] }) {
  const printFrame = useRef<HTMLIFrameElement>(null);
  const [printUrl, setPrintUrl] = useState<string | null>(null);
  const [failedPreview, setFailedPreview] = useState<string | null>(null);
  function printOriginal() {
    if (!activePdfUrl) { window.print(); return; }
    if (printUrl === activePdfUrl) {
      try { printFrame.current?.contentWindow?.print(); } catch { window.open(activePdfUrl, '_blank', 'noopener,noreferrer'); }
    } else setPrintUrl(activePdfUrl);
  }
  const { locale } = useLocale();
  const { navigateWithCurtain } = usePageTransition();
  const id = locale === "id";
  const copy = introCopy[locale];

  return (
    <main id="main-content" tabIndex={-1} className="cv-page">
      <div className="cv-container">
        <div className="cv-toolbar">
          <Link
            href="/#about"
            className="btn-ghost"
            onClick={event => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              navigateWithCurtain("/#about", "down");
            }}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            {id ? "Kembali" : "Back"}
          </Link>
          <div className="cv-toolbar-actions">
            <button className="btn-solid" type="button" onClick={printOriginal}>
              <Printer size={16} aria-hidden="true" />
              {id ? "Cetak" : "Print"}
            </button>
            {activePdfUrl && (
              <a className="btn-solid" href={activePdfUrl} download>
                <Download size={16} aria-hidden="true" />
                {id ? "Unduh CV" : "Download CV"}
              </a>
            )}
          </div>
        </div>

        <article className="cv-resume crosshair" aria-label={`${id ? "CV milik" : "CV of"} ${identity.name}`} data-paper="A4">
          <div className="cv-sheet-container">
            {/* Top Sheet Header — Always visible */}
            <header className="cv-sheet-meta mono">
              <span>{id ? "[ CV ]" : "[ CV / RESUME ]"}</span>
              <span>ISO 216 · A4 (210 × 297 MM) · PDF</span>
            </header>

            <div className={`cv-sheet-body${previewPages.length > 0 && failedPreview !== previewPages[0]?.url ? ' cv-sheet-body-pdf' : ''}`} role="region" aria-label={id ? 'Dokumen resume' : 'Resume document'}>
              {previewPages.length > 0 && failedPreview !== previewPages[0]?.url ? (
                <div className="cv-preview-pages">
                  {previewPages.map((page, index) => <img key={page.url} src={page.url} srcSet={page.srcSet} sizes="(max-width: 767px) calc(100vw - 80px), 712px" width={page.width} height={page.height} alt={`${id ? 'Halaman' : 'Page'} ${index + 1} / ${previewPages.length} — ${identity.name}`} loading={index === 0 ? 'eager' : 'lazy'} decoding="async" className="cv-pdf-canvas" onError={() => setFailedPreview(previewPages[0].url)} />)}
                </div>
              ) : (
                <div className="cv-sheet-center">
                  <div className="cv-sheet-badge">
                    <FileText size={20} aria-hidden="true" />
                    <span className="label">{id ? "Dokumen PDF A4" : "A4 PDF Document"}</span>
                  </div>
                  <h1 id="cv-name">{identity.name}</h1>
                  <p className="cv-role">{copy.role}</p>
                  <p className="cv-empty-copy">
                    {id
                      ? "Gambar preview CV tidak tersedia. PDF hanya dimuat saat Anda memilih Cetak atau Unduh CV."
                      : "CV preview image unavailable. The PDF loads only when you choose Print or Download CV."}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Sheet Footer — Always visible */}
            <footer className="cv-contact mono">
              <div className="cv-contact-row">
                <a href={`mailto:${identity.email}`}>
                  <Mail size={14} aria-hidden="true" />
                  <span>{identity.email}</span>
                </a>
                <span>
                  <MapPin size={14} aria-hidden="true" />
                  <span>Sukabumi, Indonesia</span>
                </span>
              </div>
              <div className="cv-contact-row">
                <a
                  href={identity.github}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={id ? "Profil GitHub (buka di tab baru)" : "GitHub profile (opens in a new tab)"}
                >
                  GitHub
                  <ArrowUpRight size={14} aria-hidden="true" />
                </a>
                <a
                  href={identity.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={id ? "Profil LinkedIn (buka di tab baru)" : "LinkedIn profile (opens in a new tab)"}
                >
                  LinkedIn
                  <ArrowUpRight size={14} aria-hidden="true" />
                </a>
              </div>
            </footer>
          </div>
        </article>
      </div>
      {printUrl && <iframe ref={printFrame} src={printUrl} title={id ? 'Cetak PDF asli' : 'Print original PDF'} className="cv-print-original" onLoad={() => { try { printFrame.current?.contentWindow?.print(); } catch { window.open(printUrl, '_blank', 'noopener,noreferrer'); } }} />}
    </main>
  );
}
