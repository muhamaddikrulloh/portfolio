import { createInertiaApp } from "@inertiajs/react";
import type { ComponentType, ReactNode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";

type InertiaPageComponent = ComponentType<Record<string, unknown>> & {
  layout?: (page: ReactNode) => ReactNode;
};

const pages = import.meta.glob<{ default: InertiaPageComponent }>("./Pages/**/*.tsx");

if (typeof window !== "undefined") {
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
  const navEntry = performance.getEntriesByType?.("navigation")?.[0] as PerformanceNavigationTiming | undefined;
  if (navEntry?.type === "reload") {
    window.__portfolioTargetHash = "";
    if (window.location.hash || history.state?.documentScrollPosition || history.state?.scrollRegions) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }
}

createInertiaApp({
  resolve: async name => {
    const loader = pages[`./Pages/${name}.tsx`];
    if (!loader) {
      throw new Error(`Inertia page not found: ${name}`);
    }
    const mod = await loader();
    return mod.default;
  },
  setup({ el, App, props }) {
    if (!el) return;
    if (el.hasAttribute("data-server-rendered") && el.firstElementChild) {
      hydrateRoot(el, <App {...props} />, {
        onRecoverableError(error) {
          console.error("[inertia-hydration]", error);
        },
      });
    } else {
      createRoot(el).render(<App {...props} />);
    }
  },
  progress: false,
});
