import { useEffect, useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";

export function usePathname(): string {
  const page = usePage();
  const [pathname, setPathname] = useState<string>(() => {
    const raw = (page?.url || (typeof window !== "undefined" ? window.location.pathname : "/"))
      .split("?")[0]
      .split("#")[0];
    return raw || "/";
  });

  useEffect(() => {
    const nextPath = (page?.url || window.location.pathname).split("?")[0].split("#")[0] || "/";
    setPathname(nextPath);
  }, [page?.url]);

  useEffect(() => {
    const onPopState = () => {
      setPathname(window.location.pathname || "/");
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return pathname;
}

export function useSearchParams(): URLSearchParams {
  const page = usePage();
  const [search, setSearch] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return window.location.search;
    }
    const qIdx = page?.url ? page.url.indexOf("?") : -1;
    return qIdx >= 0 ? page.url.slice(qIdx).split("#")[0] : "";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSearch(window.location.search);
    } else if (page?.url) {
      const qIdx = page.url.indexOf("?");
      setSearch(qIdx >= 0 ? page.url.slice(qIdx).split("#")[0] : "");
    }
  }, [page?.url]);

  useEffect(() => {
    const onPopState = () => {
      setSearch(window.location.search);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return useMemo(() => new URLSearchParams(search), [search]);
}

export function useRouter() {
  return useMemo(
    () => ({
      push: (href: string) => {
        router.visit(href);
      },
      replace: (href: string) => {
        router.visit(href, { replace: true });
      },
      back: () => {
        if (typeof window !== "undefined") {
          window.history.back();
        }
      },
    }),
    []
  );
}
