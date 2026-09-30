import "dotenv/config";
import fs from "fs";
import path from "path";
import type {
  GroundTruthPair,
  EvaluationResults,
  QuestionScore,
} from "@ikrigel/ragas-lib-typescript";

import { retrieveChunks } from "../services/rag.service";
import { buildChatPrompt } from "../services/prompt.service";
import { generateAnswer } from "../services/llm.service";

interface RawTestCase {
  id: string;
  project: string;
  question: string;
  ground_truth: string;
  category: string;
}

const ROOT_DIR = path.resolve(__dirname, "../../..");
const DATASET_PATH = path.resolve(ROOT_DIR, "evaluation/test_dataset.json");
const REPORTS_DIR = path.resolve(ROOT_DIR, "evaluation/reports");

const runRagasEvaluation = async () => {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("ERROR: GOOGLE_API_KEY is not defined in server/.env");
    process.exit(1);
  }

  if (!fs.existsSync(DATASET_PATH)) {
    console.error(`ERROR: Evaluation dataset not found at: ${DATASET_PATH}`);
    process.exit(1);
  }

  const rawData: RawTestCase[] = JSON.parse(
    fs.readFileSync(DATASET_PATH, "utf-8"),
  );

  console.log("============================================================");
  console.log("    RAGAS TypeScript Evaluation (@ikrigel/ragas-lib-typescript)");
  console.log("============================================================");
  console.log(`Loaded ${rawData.length} test cases from ${DATASET_PATH}\n`);

  // 1. Prepare Ground Truth Pairs for ragas-lib-typescript
  const dataset: GroundTruthPair[] = rawData.map((tc) => ({
    id: tc.id,
    question: tc.question,
    expectedAnswer: tc.ground_truth,
    metadata: {
      project: tc.project,
      category: tc.category,
    },
    tags: [tc.category, tc.project],
  }));

  // 2. Run Live RAG Generation & Context Retrieval
  console.log("[1/3] Querying LlamaIndex RAG Pipeline (Retrieval + Generation)...");
  const ragAnswers: string[] = [];
  const contexts: string[][] = [];

  for (let i = 0; i < dataset.length; i++) {
    const item = dataset[i];
    console.log(`  [${i + 1}/${dataset.length}] Q: "${item.question.slice(0, 60)}..."`);

    // Retrieve chunks from LlamaIndex PGVectorStore
    const chunks = await retrieveChunks(item.question);
    const chunkTexts = chunks.map(
      (c) =>
        `[Project: ${c.projectName} | Section: ${c.sectionType}] ${c.text.replace(/\n+/g, " ")}`,
    );
    contexts.push(chunkTexts.length ? chunkTexts : ["No context retrieved"]);

    // Build context prompt & generate answer
    const contextPrompt = chunks
      .map(
        (c) =>
          `Project: ${c.projectName}\nSection: ${c.sectionType}\nContent: ${c.text}`,
      )
      .join("\n\n");

    const prompt = buildChatPrompt(item.question, contextPrompt, "");

    // Generate answer with automatic backoff on 429 quota exhaustion
    let answer = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        answer = String(await generateAnswer(prompt)).trim();
        break;
      } catch (err: any) {
        const msg = String(err?.message || "");
        if (
          msg.includes("429") ||
          msg.includes("quota") ||
          msg.includes("QuotaExhausted") ||
          msg.includes("RESOURCE_EXHAUSTED")
        ) {
          console.log(
            "    [Gemini free-tier quota (15 RPM) reached: pausing 15s for quota reset...]",
          );
          await new Promise((r) => setTimeout(r, 15500));
          continue;
        }
        throw err;
      }
    }
    ragAnswers.push(answer);

    // Pace queries so generation stays within 15 RPM
    await new Promise((r) => setTimeout(r, 3500));
  }

  // 3. Initialize Gemini Evaluator Provider and Metrics
  console.log("\n[2/3] Initializing Gemini Provider & Ragas Metrics...");
  const {
    GeminiProvider,
    Faithfulness,
    Relevance,
    ContextPrecision,
    ContextRecall,
    Coherence,
    EvaluationRunner,
    ReportGenerator,
  } = await import("@ikrigel/ragas-lib-typescript");

  // Serialized API queue ensuring strict pacing (<= 14 requests/min) to prevent 429 quota exhaustion
  let lastRequestTime = 0;
  const MIN_INTERVAL_MS = 4300;
  let queuePromise = Promise.resolve();

  const scheduleApiCall = <T>(fn: () => Promise<T>): Promise<T> => {
    const result = queuePromise.then(async () => {
      const now = Date.now();
      const elapsed = now - lastRequestTime;
      if (elapsed < MIN_INTERVAL_MS) {
        await new Promise((r) => setTimeout(r, MIN_INTERVAL_MS - elapsed));
      }
      lastRequestTime = Date.now();
      return fn();
    });
    queuePromise = result.catch(() => {}).then(() => {});
    return result;
  };

  class CustomGeminiProvider extends (GeminiProvider as any) {
    name = "gemini";
    model = "gemini-3.5-flash-lite";
    private customApiKey: string;

    constructor(config: any) {
      super(config);
      this.model = config.model || "gemini-3.5-flash-lite";
      this.customApiKey = config.apiKey;
    }

    async sendRequest(prompt: string) {
      return scheduleApiCall(async () => {
        for (let attempt = 0; attempt < 6; attempt++) {
          try {
            return await super.sendRequest(prompt);
          } catch (err: any) {
            const msg = String(err?.message || "");
            if (
              msg.includes("quota") ||
              msg.includes("429") ||
              msg.includes("RESOURCE_EXHAUSTED") ||
              msg.includes("rate")
            ) {
              const match = msg.match(/retry in ([0-9.]+)s/i);
              const waitSec = match ? Math.ceil(parseFloat(match[1])) + 2 : 15;
              console.log(
                `    [Rate limit window full: waiting ${waitSec}s to resume queue...]`,
              );
              await new Promise((resolve) => setTimeout(resolve, waitSec * 1000));
              lastRequestTime = Date.now();
              continue;
            }
            throw err;
          }
        }
        return await super.sendRequest(prompt);
      });
    }

    async generateEmbedding(text: string): Promise<number[]> {
      return scheduleApiCall(async () => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${this.customApiKey}`;
        for (let attempt = 0; attempt < 6; attempt++) {
          try {
            const res = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                model: "models/gemini-embedding-001",
                content: { parts: [{ text }] },
              }),
            });
            const data = (await res.json()) as any;
            if (!res.ok || data.error) {
              const errMsg = data.error?.message || String(res.status);
              if (
                errMsg.includes("429") ||
                errMsg.includes("quota") ||
                errMsg.includes("RESOURCE_EXHAUSTED")
              ) {
                const match = errMsg.match(/retry in ([0-9.]+)s/i);
                const waitSec = match ? Math.ceil(parseFloat(match[1])) + 2 : 15;
                await new Promise((r) => setTimeout(r, waitSec * 1000));
                lastRequestTime = Date.now();
                continue;
              }
              throw new Error(`Gemini Embedding error: ${errMsg}`);
            }
            return data.embedding.values;
          } catch (err: any) {
            if (attempt === 5) throw err;
            await new Promise((r) => setTimeout(r, 4000));
          }
        }
        throw new Error("Failed to generate embedding after retries");
      });
    }
  }

  const provider = new CustomGeminiProvider({
    apiKey,
    model: "gemini-3.5-flash-lite",
    temperature: 0.0,
  });

  const metrics = [
    new Faithfulness(provider),
    new Relevance(provider),
    new ContextPrecision(provider),
    new ContextRecall(provider),
    new Coherence(provider),
  ];

  console.log(
    `  Registered metrics: ${metrics.map((m) => m.name).join(", ")}`,
  );

  // 4. Run Evaluation with EvaluationRunner
  console.log("\n[3/3] Running Ragas Assessment (computing metric scores)...");
  const runner = new EvaluationRunner({
    parallel: false, // Run sequentially to respect Gemini free-tier 15 RPM
    timeout: 300000,
    continueOnError: true,
    passThreshold: 7, // 7/10 is passing
    verbose: false,
  });

  const results: EvaluationResults = await runner.run(
    dataset,
    ragAnswers,
    metrics,
    {
      contexts,
      providerName: provider.name,
      modelName: provider.model,
      onProgress: (current: number, total: number) => {
        console.log(`  Progress: ${current}/${total} questions evaluated`);
      },
    },
  );

  // 5. Generate and Save Reports (HTML, CSV, JSON)
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }

  const reporter = new ReportGenerator();

  await reporter.generate(results, {
    format: "json",
    outputPath: path.resolve(REPORTS_DIR, "evaluation_report.json"),
  });

  await reporter.generate(results, {
    format: "csv",
    outputPath: path.resolve(REPORTS_DIR, "evaluation_report.csv"),
  });

  await reporter.generate(results, {
    format: "html",
    outputPath: path.resolve(REPORTS_DIR, "evaluation_report.html"),
    title: "Company Knowledge RAG - Ragas Evaluation Report",
    description: "Evaluated using @ikrigel/ragas-lib-typescript with Google Gemini",
  });

  // 6. Display Formatted Console Output
  console.log("\n" + "=".repeat(65));
  console.log("                   RAGAS EVALUATION REPORT                   ");
  console.log("=".repeat(65));
  console.log(
    `Overall Score: ${(results.overallScore).toFixed(2)} / 10  (${results.overallScore >= 7 ? "PASS" : "NEEDS IMPROVEMENT"})`,
  );
  console.log(`Total Questions Evaluated: ${results.metadata.totalQuestions}`);
  console.log(`Evaluation Duration      : ${(results.metadata.evaluationDurationMs / 1000).toFixed(1)}s`);
  console.log(`Evaluator Model          : ${results.metadata.model} (${results.metadata.provider})`);

  console.log("\n--- METRIC AVERAGES (Scale 0 to 10) ---");
  for (const [metricName, score] of Object.entries(results.metrics)) {
    const numScore = Number(score);
    const status = numScore >= 7 ? "PASS" : "LOW";
    console.log(`  ${metricName.padEnd(20)}: ${numScore.toFixed(2)} / 10   [${status}]`);
  }

  console.log("\n--- SUMMARY STATISTICS ---");
  console.log(`  Mean Score             : ${results.statistics.mean.toFixed(2)} / 10`);
  console.log(`  Median Score           : ${results.statistics.median.toFixed(2)} / 10`);
  console.log(`  Std Deviation          : ${results.statistics.stdDev.toFixed(2)}`);
  console.log(
    `  Passed Threshold (>= 7): ${results.statistics.passedThresholdPercentage.toFixed(1)}%`,
  );

  console.log("\n--- PER-QUESTION BREAKDOWN ---");
  console.table(
    results.perQuestion.map((q: QuestionScore, idx: number) => ({
      ID: dataset[idx]?.id || `#${idx + 1}`,
      Question:
        q.question.length > 35 ? q.question.substring(0, 32) + "..." : q.question,
      Faithfulness: (q.scores.faithfulness ?? 0).toFixed(1),
      Relevance: (q.scores.relevance ?? 0).toFixed(1),
      Precision: (q.scores.context_precision ?? 0).toFixed(1),
      Recall: (q.scores.context_recall ?? 0).toFixed(1),
      Coherence: (q.scores.coherence ?? 0).toFixed(1),
      Overall: q.overallScore.toFixed(1),
    })),
  );

  console.log("=".repeat(65));
  console.log(`Reports successfully exported to:\n  file://${REPORTS_DIR}/evaluation_report.html\n  file://${REPORTS_DIR}/evaluation_report.json\n  file://${REPORTS_DIR}/evaluation_report.csv\n`);
};

runRagasEvaluation().catch((err) => {
  console.error("Evaluation execution failed:", err);
  process.exit(1);
});
