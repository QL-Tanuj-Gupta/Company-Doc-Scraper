import "dotenv/config";
import fs from "fs";
import path from "path";

import { retrieveChunks } from "../services/rag.service";
import { buildChatPrompt } from "../services/prompt.service";
import { generateAnswer } from "../services/llm.service";

// CONFIG

const DATASET_PATH = path.join(__dirname, "dataset.json");

const REPORTS_DIR = path.join(__dirname, "reports");

const REPORT_PATHS = {
  json: path.join(REPORTS_DIR, "evaluation_report.json"),
  csv: path.join(REPORTS_DIR, "evaluation_report.csv"),
  html: path.join(REPORTS_DIR, "evaluation_report.html"),
};

// TYPES
interface TestCase {
  id: string;
  project: string;
  question: string;
  ground_truth: string;
  category: string;
}

// LOAD DATASET
function loadDataset(): TestCase[] {
  if (!fs.existsSync(DATASET_PATH)) {
    throw new Error(`Dataset not found: ${DATASET_PATH}`);
  }

  return JSON.parse(fs.readFileSync(DATASET_PATH, "utf-8"));
}

// Run Rag
async function runRag(testCases: TestCase[]) {
  const answers: string[] = [];
  const contexts: string[][] = [];

  console.log(`\nRunning RAG for ${testCases.length} questions...\n`);

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];

    console.log(
      `[${i + 1}/${testCases.length}] ${testCase.id} - ${testCase.question}`,
    );

    const chunks = await retrieveChunks(testCase.question);

    console.log(`Retrieved ${chunks.length} chunks`);

    const context = chunks.map((chunk) => chunk.text);

    contexts.push(context);

    const contextText = chunks.map((chunk) => chunk.text).join("\n\n");

    const prompt = buildChatPrompt(testCase.question, contextText, "");

    const answer = String(await generateAnswer(prompt)).trim();

    answers.push(answer);

    console.log(`Answer generated\n`);
  }

  return {
    answers,
    contexts,
  };
}

// Running Evaluation

async function runEvaluation(
  testCases: TestCase[],
  answers: string[],
  contexts: string[][],
) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("Google API key is not defined.");
  }

  const {
    GeminiProvider,
    Faithfulness,
    Relevance,
    ContextPrecision,
    ContextRecall,
    Coherence,
    EvaluationRunner,
  } = await import("@ikrigel/ragas-lib-typescript");

  const provider = new GeminiProvider({
    apiKey,
    model: "gemini-3.5-flash-lite",
    temperature: 0,
  });

  const metrics = [
    new Faithfulness(provider),
    new Relevance(provider),
    new ContextPrecision(provider),
    new ContextRecall(provider),
    new Coherence(provider),
  ];

  const ragasDataset = testCases.map((testCase) => ({
    id: testCase.id,
    question: testCase.question,
    expectedAnswer: testCase.ground_truth,

    metadata: {
      project: testCase.project,
      category: testCase.category,
    },

    tags: [testCase.project, testCase.category],
  }));
  console.log("Starting RAGAS evaluation...\n");

  const runner = new EvaluationRunner({
    parallel: false,
    continueOnError: true,
    timeout: 300000,
    passThreshold: 7,
    verbose: false,
  });

  const results = await runner.run(ragasDataset, answers, metrics, {
    contexts,

    providerName: "gemini",
    modelName: "gemini-3.5-flash-lite",

    onProgress: (current: number, total: number) => {
      console.log(`Evaluation: ${current}/${total}`);
    },
  });
  return results;
}

// GENERATE REPORTS

async function generateReports(results: any) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const { ReportGenerator } = await import("@ikrigel/ragas-lib-typescript");

  const reporter = new ReportGenerator();

  await reporter.generate(results, {
    format: "json",
    outputPath: REPORT_PATHS.json,
  });

  await reporter.generate(results, {
    format: "csv",
    outputPath: REPORT_PATHS.csv,
  });

  await reporter.generate(results, {
    format: "html",
    outputPath: REPORT_PATHS.html,
    title: "RAG Evaluation Report",
    description: "RAG evaluation using RAGAS and Google Gemini",
  });
}

// PRINT RESULTS

function printResults(results: any) {
  console.log("RAGAS EVALUATION");

  console.log(`Overall Score: ${results.overallScore.toFixed(2)} / 10`);

  console.log(`Questions: ${results.metadata.totalQuestions}`);

  console.log("\nMetrics:");

  for (const [metric, score] of Object.entries(results.metrics)) {
    console.log(`${metric.padEnd(22)} ${Number(score).toFixed(2)} / 10`);
  }
}

// MAIN

async function main() {
  const startTime = Date.now();

  try {
    console.log("\nStarting RAG evaluation...\n");

    const testCases = loadDataset();
    console.log(`Dataset:${testCases.length} questions`);

    const { answers, contexts } = await runRag(testCases);

    const results = await runEvaluation(testCases, answers, contexts);

    await generateReports(results);

    printResults(results);

    const duration = (Date.now() - startTime) / 1000;

    console.log(`Completed in ${duration.toFixed(1)}s`);
  } catch (error) {
    console.error("\nEvaluation failed:", error);

    process.exit(1);
  }
}

main();
