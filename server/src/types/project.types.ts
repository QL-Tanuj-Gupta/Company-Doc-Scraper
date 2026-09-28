export interface CreateProjectInput {
  projectName: string;
  overview: string | null;
  technologies: string[] | null;
  team: string[] | null;
  features: string[] | null;
}

export interface ProjectChunkData {
  sectionType: string;
  text: string;
}
