import type { ReactNode } from "react";
import AllProjectsClient from "@/app/(frontend)/projects/all-projects-client";
import type { ProjectItemData } from "@/lib/cms-types";
import PortfolioLayout from "../Layouts/PortfolioLayout";

type ProjectsProps = {
  initialProjects: {
    en: ProjectItemData[];
    id: ProjectItemData[];
  };
};

export default function Projects({ initialProjects }: ProjectsProps) {
  return <AllProjectsClient initialProjects={initialProjects} />;
}

Projects.layout = (page: ReactNode) => <PortfolioLayout>{page}</PortfolioLayout>;
