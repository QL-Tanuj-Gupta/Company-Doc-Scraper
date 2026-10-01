import { vectorStore, VECTOR_TABLE, VECTOR_SCHEMA } from "../config/llamaindex";
import { CreateProjectInput } from "../types/project.types";

export const checkProjectExists = async (projectName: string) => {
  const db = await vectorStore.client();
  const rows = await db.query(
    `SELECT 1 FROM ${VECTOR_SCHEMA}.${VECTOR_TABLE} WHERE LOWER(metadata->>'projectName') = LOWER($1) LIMIT 1`,
    [projectName.trim()],
  );

  return rows.length > 0;
};

const toList = (items: string[] | null) =>
  items?.length ? items.map((item) => `- ${item}`).join("\n") : null;

export const createProjectMarkdown = (project: CreateProjectInput): string => {
  const sections = [
    ["Overview", project.overview?.trim()],
    ["Technologies", toList(project.technologies)],
    ["Team", toList(project.team)],
  ] as const;

  const blocks = sections
    .filter(([, body]) => body)
    .map(([title, body]) => `## ${title}\n\n${body}`);

  return [`# ${project.projectName}`, ...blocks].join("\n\n") + "\n";
};
