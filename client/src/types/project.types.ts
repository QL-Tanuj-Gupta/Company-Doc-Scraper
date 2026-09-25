export interface ProjectData {
  projectName: string;
  overview: string | null;
  technologies: string[] | null;
  team: string[] | null;
  features: string[] | null;
}

export interface AddProjectResponse {
  success: boolean;
  message: string;
  data?: {
    project: ProjectData;
    markdown: string;
    chunks: {
      sectionType: string;
      text: string;
    }[];
  };
}
