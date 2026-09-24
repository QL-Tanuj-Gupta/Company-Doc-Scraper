CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE "project_chunks" (
    "id" BIGSERIAL NOT NULL,
    "project_name" TEXT NOT NULL,
    "section_type" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "embedding" vector(768) NOT NULL,

    CONSTRAINT "project_chunks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_project_chunks_project_name"
ON "project_chunks"("project_name");
