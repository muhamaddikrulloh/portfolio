import gsap from "gsap";

export const motionTokens = {
  ease: {
    heroRise: "cubic-bezier(0.22, 0.61, 0.36, 1)",
    expoOut: "expo.out",
    power2Out: "power2.out",
    power2InOut: "power2.inOut",
    power3Out: "power3.out",
    curtain: "0.76, 0, 0.24, 1",
  },
  duration: {
    grandEntrance: 2.2,
    wordmarkEntrance: 2.0,
    characterReveal: 1.8,
    contentReveal: 1.4,
    panelReveal: 1.2,
    overlayCurtain: 0.75,
    overlayItems: 0.85,
    micro: 0.45,
  },
  stagger: {
    character: 0.025,
    characterAmount: 0.9,
    content: 0.12,
    panel: 0.15,
  },
  scrollScrub: {
    scrubSmooth: 0.5,
  },
} as const;

export function primeGsapElements(
  elements: Iterable<Element>,
  options?: { opacity?: boolean; filter?: boolean },
): HTMLElement[] {
  const list: HTMLElement[] = [];
  for (const el of elements) {
    if (el instanceof HTMLElement) list.push(el);
  }
  const independentTransforms = list.map(el => {
    const computed = getComputedStyle(el);
    return computed.translate === "none" && computed.rotate === "none" && computed.scale === "none";
  });
  list.forEach((el, index) => {
    if (!independentTransforms[index]) return;
    el.style.translate = "none";
    el.style.rotate = "none";
    el.style.scale = "none";
  });
  const values = list.map(el => {
    gsap.getProperty(el, "x");
    const vars: gsap.TweenVars = {};
    if (options?.opacity || options?.filter) {
      const computed = getComputedStyle(el);
      if (options.opacity && !el.style.opacity) vars.opacity = computed.opacity;
      if (options.filter && !el.style.filter) vars.filter = computed.filter;
    }
    return vars;
  });
  list.forEach((el, index) => {
    if (Object.keys(values[index]).length) gsap.set(el, values[index]);
  });
  return list;
}

export function scheduleMotionInit(
  callback: () => (() => void) | void,
  delayMs = 16,
): () => void {
  if (typeof window === "undefined") return () => {};
  let cleanup: (() => void) | void;
  let cancelled = false;
  const timer = window.setTimeout(() => {
    if (cancelled) return;
    cleanup = callback();
  }, delayMs);
  return () => {
    cancelled = true;
    window.clearTimeout(timer);
    if (typeof cleanup === "function") cleanup();
  };
}

export function observeViewportReveal(
  element: Element | null | undefined,
  onReveal: () => void,
  rootMargin = "-5% 0px -10% 0px",
): () => void {
  if (!element || typeof window === "undefined") return () => {};
  const observer = new IntersectionObserver(
    entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.disconnect();
        onReveal();
        break;
      }
    },
    { rootMargin, threshold: 0 },
  );
  observer.observe(element);
  return () => observer.disconnect();
}
