import type { ReactNode } from "react";
import { PageTransitionProvider } from "@/app/page-transition";
import { LocaleProvider } from "@/app/locale-provider";
import SiteShell from "@/app/site-shell";

export default function PortfolioLayout({ children }: { children: ReactNode }) {
  return (
    <PageTransitionProvider>
      <LocaleProvider>
        <SiteShell>{children}</SiteShell>
      </LocaleProvider>
    </PageTransitionProvider>
  );
}
