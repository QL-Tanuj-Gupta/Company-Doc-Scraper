# Dynamic Software Interfaces

## Overview

A customization layer you drop into your product so the UI can change itself for each individual user.

**The problem it solves:** In B2B SaaS, every customer wants the product slightly differently. Normally that means your team building bespoke features forever. DynamicUi lets the user do it themselves — no code changes on your side.

**How it works, in one line:** It's an embedded AI agent. The user asks for something in plain language ("show my balances as a donut chart", "make this section green", "rename this heading"), and the agent builds or modifies that piece of UI right there — using your product's own components and your own API, acting as the signed-in user.

**Two important guarantees:**

- Your source code is never touched — everything happens in a sandboxed layer on top
- The agent can only do what the logged-in user is already allowed to do, since it goes through your own API — plus approvals and confirmations on anything destructive

## Technologies

- TypeScript, Node.js (ESM), pnpm + Turborepo monorepo
- Vercel AI SDK, Anthropic/OpenAI adapters, MCP SDK, Zod
- React 19, Next.js, Tailwind CSS, Recharts
- Sandboxed iframe execution: QuickJS (WASM), E2B
- PGlite (local dev) / Postgres (production)

## Team

- Shivankul
- Rohit
- Nisha
- Tanmay

## Features

- Personalized UI per user — each person's dashboard can look and behave differently, and their version is saved for them
- Build new views on demand — the agent composes a live view from your existing data and components
- Edit in place — hover any section, describe the change, apply it
- Automations — describe a recurring task, it becomes a standing automation
