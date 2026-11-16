import type { ReactNode } from "react";
import PortfolioIntro from "@/app/portfolio-intro";
import type { PortfolioBundle } from "@/lib/cms-types";
import PortfolioLayout from "../Layouts/PortfolioLayout";

type HomeProps = {
  initialBundle: {
    en: PortfolioBundle;
    id: PortfolioBundle;
  };
};

export default function Home({ initialBundle }: HomeProps) {
  return <PortfolioIntro initialBundle={initialBundle} />;
}

Home.layout = (page: ReactNode) => <PortfolioLayout>{page}</PortfolioLayout>;
