import { CreateProjectInput } from "../types/project.types";
import { vectorStore, VECTOR_SCHEMA, VECTOR_TABLE } from "../config/llamaindex";

// True if any chunk already belongs to a project with this name (any casing).
export const checkProjectExists = async (projectName: string) => {
  const db = await vectorStore.client(); // also creates the table on first run
  const rows = await db.query(
    `SELECT 1 FROM ${VECTOR_SCHEMA}.${VECTOR_TABLE} WHERE LOWER(metadata->>'projectName') = LOWER($1) LIMIT 1`,
    [projectName.trim()],
  );
  return rows.length > 0;
};

// "- item" lines, or null when empty so the whole section gets skipped.
const toList = (items: string[] | null) =>
  items?.length ? items.map((item) => `- ${item}`).join("\n") : null;

// Headings must start at column 0, or the Markdown parser won't see them.
export const createProjectMarkdown = (project: CreateProjectInput): string => {
  const sections = [
    ["Overview", project.overview?.trim()],
    ["Technologies", toList(project.technologies)],
    ["Team", toList(project.team)],
    ["Features", toList(project.features)],
  ] as const;

  const blocks = sections
    .filter(([, body]) => body)
    .map(([title, body]) => `## ${title}\n\n${body}`);

  return [`# ${project.projectName}`, ...blocks].join("\n\n") + "\n";
};
