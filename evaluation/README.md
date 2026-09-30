# RAGAS TypeScript Evaluation (@ikrigel/ragas-lib-typescript)

This directory contains the **Ragas** evaluation setup for the Company Knowledge RAG pipeline built with **LlamaIndex.TS** and Express.

Evaluation is 100% native TypeScript/Node.js powered by [`@ikrigel/ragas-lib-typescript`](https://www.npmjs.com/package/@ikrigel/ragas-lib-typescript). No Python environment or subprocess is required.

---

## 1. What is Ragas Evaluation?

Ragas breaks evaluation down into two independent components—**Retrieval** and **Generation**—to identify whether poor answers are due to retrieval failures or LLM hallucinations:

```
                      ┌──────────────────────┐
                      │    User Question     │
                      └──────────┬───────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
       [ Retrieval Quality ]            [ Generation Quality ]
  ┌─────────────────────────────┐   ┌─────────────────────────────┐
  │ 1. Context Precision        │   │ 3. Faithfulness             │
  │    (Is relevant info        │   │    (Is answer grounded      │
  │     ranked at top?)         │   │     without hallucination?) │
  ├─────────────────────────────┤   ├─────────────────────────────┤
  │ 2. Context Recall           │   │ 4. Relevance                │
  │    (Did we retrieve all     │   │    (Does answer directly    │
  │     ground truth facts?)    │   │     answer the question?)   │
  └─────────────────────────────┘   ├─────────────────────────────┤
                                    │ 5. Coherence                │
                                    │    (Is response clear       │
                                    │     and structured?)        │
                                    └─────────────────────────────┘
```

### The 5 Core Metrics (Score Scale: 0 to 10)

| Metric                | Component | What It Measures                                                                                                                            | Target         |
| :-------------------- | :-------- | :------------------------------------------------------------------------------------------------------------------------------------------ | :------------- |
| **Faithfulness**      | Generator | Factual consistency: are all claims in the generated answer directly supported by the retrieved context chunks? Detects **hallucinations**. | $\ge 7.0$ / 10 |
| **Relevance**         | Generator | Relevance: does the generated answer directly address the question without dodging or adding irrelevant chatter?                            | $\ge 7.0$ / 10 |
| **Context Precision** | Retriever | Signal-to-noise ratio: are the chunks containing ground truth information ranked higher than irrelevant chunks?                             | $\ge 7.0$ / 10 |
| **Context Recall**    | Retriever | Completeness: did the retriever fetch all chunks necessary to satisfy the ground truth answer?                                              | $\ge 7.0$ / 10 |
| **Coherence**         | Generator | Structural quality: evaluates whether the answer is logically structured, coherent, and consistent.                                         | $\ge 7.0$ / 10 |

---

## 2. Directory Structure

```
evaluation/
├── test_dataset.json        # Golden evaluation dataset (queries, ground truth, categories)
├── reports/                 # Auto-generated reports (HTML, CSV, JSON)
└── README.md                # This guide

server/
├── src/scripts/evaluate.ts  # Native evaluation script (@ikrigel/ragas-lib-typescript)
└── package.json             # npm run eval script
```

---

## 3. How to Run Evaluation

### Step 1: Ensure Postgres (pgvector) is Running

```bash
docker compose up -d
```

### Step 2: Run Evaluation

From the `server` folder, run:

```bash
npm run eval
```

The script will:

1. Load `test_dataset.json` containing test cases across all company projects (`Project Navigator`, `Dynamic Software Interfaces`, `EverTest`, `Within Health`).
2. Run live retrieval via LlamaIndex (`retrieveChunks`) and answer generation (`generateAnswer`).
3. Evaluate using `@ikrigel/ragas-lib-typescript` with Google Gemini (`GeminiProvider`).
4. Print the score summary and detailed question-by-question breakdown table to your terminal.
5. Export reports to `evaluation/reports/`:
   - `evaluation_report.html` (Interactive dashboard with charts and scores)
   - `evaluation_report.json`
   - `evaluation_report.csv`

---

## 4. Interpreting Results & Tuning Your Pipeline

### How to Fix Low Scores:

- **Low Faithfulness (< 7.0)**:
  - The model is hallucinating facts not in the context.
  - **Fix**: Review `server/src/services/prompt.service.ts`. Ensure rule 1 ("USE ONLY PROVIDED INFORMATION") and rule 5 ("If not present, say I don't have enough information") are strictly enforced. Set LLM `temperature: 0` in `server/src/services/llm.service.ts`.

- **Low Relevance (< 7.0)**:
  - The model is giving vague, evasive, or overly verbose answers.
  - **Fix**: Tune `condenseQuestion` in `rag.service.ts` or make the system prompt emphasize concise, direct answers.

- **Low Context Precision (< 7.0)**:
  - Irrelevant chunks are ranking higher than relevant chunks.
  - **Fix**: In `server/src/services/rag.service.ts`, adjust `MIN_SIMILARITY` (e.g., raise from `0.3` to `0.45` or `0.5`) or tune chunking granularity in `server/src/services/chunk.service.ts`.

- **Low Context Recall (< 7.0)**:
  - Key information required to answer the question was missed during retrieval.
  - **Fix**: Increase `TOP_K` in `server/src/services/rag.service.ts` (e.g. from `5` to `7` or `8`).
