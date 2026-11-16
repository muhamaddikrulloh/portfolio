import type { ReactNode } from "react";
import CvClient from "@/app/(frontend)/cv/cv-client";
import type { ResumeData } from "@/lib/cms-types";
import PortfolioLayout from "../Layouts/PortfolioLayout";

type CvProps = {
  activePdfUrl?: string | null;
  initialResume?: {
    en: ResumeData;
    id: ResumeData;
  };
};

export default function Cv({ activePdfUrl, initialResume }: CvProps) {
  return <CvClient activePdfUrl={activePdfUrl ?? null} previewPages={initialResume?.en.previewPages} />;
}

Cv.layout = (page: ReactNode) => <PortfolioLayout>{page}</PortfolioLayout>;
