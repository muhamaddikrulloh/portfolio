"use client";

import { useEffect, useRef, useState } from 'react';

type Preview = {
  canvas: HTMLCanvasElement;
  timer: ReturnType<typeof setTimeout>;
  expires: number;
};
type Pending = {
  promise: Promise<HTMLCanvasElement>;
  users: number;
  cancelled: boolean;
  destroy?: () => void;
};
const previews = new Map<string, Preview>();
const loading = new Map<string, Pending>();
const maxPreviews = 8;
const maxPixels = 4_000_000;

function getPreview(url: string) {
  let cached = previews.get(url);
  if (cached && cached.expires <= Date.now()) {
    clearTimeout(cached.timer);
    previews.delete(url);
    cached = undefined;
  }
  if (cached) {
    previews.delete(url);
    previews.set(url, cached);
    return { promise: Promise.resolve(cached.canvas), release() {} };
  }
  const pending = loading.get(url);
  if (pending) return acquire(pending);

  const work: Pending = { promise: undefined!, users: 0, cancelled: false };
  work.promise = (async () => {
    const pdfjs = await import('pdfjs-dist');
    if (work.cancelled) throw new Error('PDF preview cancelled');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
    const task = pdfjs.getDocument({ url, verbosity: 0, rangeChunkSize: 1_048_576 });
    work.destroy = () => { void task.destroy().catch(() => {}); };
    try {
      const pdf = await task.promise;
      const page = await pdf.getPage(1);
      try {
        const viewport = page.getViewport({ scale: 1 });
        const scale = Math.min(2, 1600 / viewport.width, Math.sqrt(maxPixels / (viewport.width * viewport.height)), 16384 / Math.max(viewport.width, viewport.height));
        const scaled = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.floor(scaled.width));
        canvas.height = Math.max(1, Math.floor(scaled.height));
        await page.render({ canvas, viewport: scaled }).promise;
        return canvas;
      } finally {
        page.cleanup();
      }
    } finally {
      await task.destroy();
    }
  })();

  loading.set(url, work);
  void work.promise.then(result => {
    if (loading.get(url) === work) loading.delete(url);
    work.destroy = undefined;
    if (work.cancelled) return;
    const timer = setTimeout(() => { previews.delete(url); }, 60_000);
    previews.set(url, { canvas: result, timer, expires: Date.now() + 60_000 });
    if (previews.size > maxPreviews) {
      const oldest = previews.keys().next().value!;
      clearTimeout(previews.get(oldest)!.timer);
      previews.delete(oldest);
    }
  }, () => { if (loading.get(url) === work) loading.delete(url); });
  return acquire(work);

  function acquire(current: Pending) {
    current.users++;
    return {
      promise: current.promise,
      release() {
        current.users--;
        if (!current.users && loading.get(url) === current) {
          current.cancelled = true;
          loading.delete(url);
          current.destroy?.();
        }
      },
    };
  }
}

export default function CertificatePdf({ url, title }: { url: string; title: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setFailed(null);
    let release: (() => void) | undefined;
    const target = canvas.current;
    if (target) delete target.dataset.ready;
    const observer = new IntersectionObserver(async ([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      try {
        const acquired = getPreview(url);
        release = acquired.release;
        const preview = await acquired.promise;
        if (cancelled || !target) return;
        target.width = preview.width;
        target.height = preview.height;
        const context = target.getContext('2d');
        if (!context) throw new Error('Canvas unavailable');
        context.drawImage(preview, 0, 0);
        target.dataset.ready = 'true';
      } catch {
        if (!cancelled) setFailed(url);
      }
    }, { rootMargin: '200px' });
    if (target) observer.observe(target);
    return () => {
      cancelled = true;
      release?.();
      observer.disconnect();
      if (target) { target.width = 0; target.height = 0; }
    };
  }, [url]);

  return <>
    {failed === url && <span role="status">PDF preview unavailable</span>}
    <canvas ref={canvas} role="img" aria-label={title} className="certificate-artwork" style={{ display: failed === url ? 'none' : undefined, width: '100%', height: '100%', objectFit: 'contain' }} />
  </>;
}
