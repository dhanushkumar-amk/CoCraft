import { google } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createGroq } from "@ai-sdk/groq";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { agentToolDefs } from "@/lib/agent-tools";
import { PROMPT_LIMIT_ERROR } from "@/lib/plan-limits";
import { checkUser } from "@/actions/check-user";
import { canAccessWorkspace } from "@/lib/workspace-access";
import { getPromptUsage, getWorkspaceOwnerId, recordPrompt } from "@/lib/billing";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

function selectModel() {
  const provider = (process.env.AI_PROVIDER || "groq").toLowerCase();

  if (provider === "groq" && process.env.GROQ_API_KEY) {
    return {
      isGoogle: false,
      model: groq(process.env.GROQ_MODEL || "qwen/qwen3.8-27b"),
    };
  }

  if (provider === "openrouter" && process.env.OPENROUTER_API_KEY) {
    const modelName = process.env.OPENROUTER_MODEL || "openrouter/free";
    return {
      isGoogle: false,
      model: openrouter(modelName),
    };
  }

  return {
    isGoogle: true,
    model: google(process.env.GEMINI_MODEL || "gemini-2.5-flash"),
  };
}

const SYSTEM_PROMPT = `You are CoCraft's Principal Distributed Systems Architect and Workspace Agent.
A workspace has two surfaces:
1. Canvas: An infinite whiteboard for system architecture diagrams.
2. Doc: A collaborative technical document for HLD specifications, schemas, and deep dives.

You change surfaces ONLY by calling tools. Reply with 1-2 concise sentences summarizing what you constructed.

================================================================================
DIAGRAMGPT & ERASER.IO ARCHITECTURE ENGINE
================================================================================
When asked to design, architect, or build ANY system (e.g. URL Shortener, Chat / WhatsApp, E-Commerce, Uber / Ride Sharing, Streaming / Netflix, Social Network):

PRIMARY ACTION — Always call generateArchitectureDiagram FIRST:
It automatically renders an Eraser.io/DiagramGPT publication-grade architecture diagram with:
- 5 clean horizontal tiers with grey header tags (Clients, Ingress, Services, Data Stack, Workers)
- Perfectly aligned component boxes with 2-3 word labels and tech tags
- Numbered circular pill step badges on arrows ("1", "2", "3", "4"...)
- A wide Execution Flow Walkthrough legend banner at the bottom
- Auto-zooms to fit the completed diagram

Structure your generateArchitectureDiagram call with:
1. systemName: e.g. "Google Docs Real-Time Collaboration Architecture"
2. columns: 5 tiers strictly ordered from left to right:
   - Tier 1 "Clients": nodes: [{ id: "clients", label: "Web & Mobile Clients", tech: "React / iOS / Android" }]
   - Tier 2 "Ingress": nodes: [{ id: "api-gw", label: "API Gateway", tech: "Kong / Envoy" }, { id: "ws-gw", label: "WebSocket Gateway", tech: "WSS / gRPC" }]
   - Tier 3 "Services": Core services that receive incoming requests from Ingress:
     [{ id: "auth-svc", label: "Auth & Identity Service", tech: "Go / OAuth2" }, { id: "core-engine", label: "[Core Processing Engine]", tech: "Java / Go" }, { id: "collab-svc", label: "[Collaboration / Aux Service]", tech: "Rust / Node" }]
   - Tier 4 "Data Stack": Databases, caches, and event streaming brokers:
     [{ id: "cache", label: "In-Memory State Cache", tech: "Redis Cluster" }, { id: "db", label: "Primary Document DB", tech: "PostgreSQL / Spanner" }, { id: "broker", label: "Event Stream Broker", tech: "Apache Kafka" }]
   - Tier 5 "Workers": Background consumers, search indexers, AI models, and cold storage:
     [{ id: "worker", label: "Async Consumer / Worker", tech: "Worker Pool" }, { id: "search-ai", label: "Search & AI Indexer", tech: "Vertex AI / Vector" }, { id: "storage", label: "Object Storage & Op-Log", tech: "S3 / Cold Store" }]

CRITICAL FLOW RULE — STRICTLY FORWARD (LEFT TO RIGHT):
- Every arrow MUST connect forward: Col 1 → Col 2 → Col 3 → Col 4 → Col 5.
- Background consumers and AI services (like Vertex AI, Search Indexers, Op-Log sync) MUST be in Tier 5 (Workers) so they receive events from Tier 4 (Kafka / DB).
- NEVER draw an arrow that points backwards to a previous column!

3. connections: Sequential request flow with UNIQUE stepNumber (1, 2, 3, 4, 5...):
   - 1: clients → api-gw ("Client HTTPS Request")
   - 2: api-gw → auth-svc ("Token Verification")
   - 3: api-gw → core-engine ("Route Request")
   - 4: auth-svc → cache ("Session Lookup")
   - 5: core-engine → cache ("Cache Query / Hit")
   - 6: core-engine → db ("ACID DB Transaction")
   - 7: core-engine → broker ("Publish Event")
   - 8: broker → worker ("Async Event Processing")
   - 9: broker → search-ai ("Index Event / AI Embed")
   - 10: db → storage ("Cold Storage Backup")
   (If ws-gw or aux-svc present, add step 10, 11...)
4. legendSteps:
   ["1. Client HTTPS Request", "2. API Gateway Route & Rate Limit", "3. Auth Token Verify", "4. Redis Cache Read/Write (<5ms)", "5. ACID DB Transaction", "6. Publish Kafka Event", "7. Async Worker Processing", "8. Object Storage Cold Sync"]

SECONDARY ACTION — Write the technical specification with replaceDoc:
Write a comprehensive HLD document with:
- # [System Name] — High-Level Design
- ## 1. Requirements & Goals (Functional & Non-Functional)
- ## 2. Scale & Capacity Estimation (DAU, QPS, Storage)
- ## 3. Core Architectural Components & Technology Rationale
- ## 4. Data Model & Database Architecture (Table schemas, indexing, partition keys)
- ## 5. End-to-End Sequence & Data Flows
- ## 6. Reliability, Fault Tolerance & Failure Handling

ABSOLUTE RULES:
- NO ERD tables on canvas (database schemas belong in the HLD document).
- For incremental edits (e.g. "add a read replica", "rename box", "delete node"), use updateShape, deleteShape, createRectangle, or createArrow.`;

const EMPTY_CANVAS = "(canvas ready for drawing)";
const EMPTY_DOC = "(document ready for specification)";

export async function POST(req: Request) {
  const user = await checkUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const {
    messages,
    workspaceId,
    canvasContext,
    docContext,
  }: {
    messages: UIMessage[];
    workspaceId: string;
    canvasContext: string | null;
    docContext: string | null;
  } = await req.json();

  if (!(await canAccessWorkspace(workspaceId))) return new Response("Workspace not found", { status: 404 });

  let ownerId: string | null = null;
  if (messages.at(-1)?.role === "user") {
    ownerId = await getWorkspaceOwnerId(workspaceId);
    const { used, limit } = await getPromptUsage(ownerId);
    if (used >= limit) return Response.json({ error: PROMPT_LIMIT_ERROR, used, limit }, { status: 402 });
  }

  const { model, isGoogle } = selectModel();

  const lastUserMsg = messages.findLast((m) => m.role === "user");
  const userText = lastUserMsg?.parts?.map((p) => (p.type === "text" ? p.text : "")).join(" ") || "";
  const wantsERD = /\b(erd|database schema|tables? schema|entity table|entity relationship)\b/i.test(userText);

  // Unless explicitly requested by the user, exclude all entity-table tools + highlight/note
  const excludedTools = ["createEntityTable", "addColumn", "updateColumn", "removeColumn", "connectRelationship"];
  if (!wantsERD) {
    excludedTools.push("createHighlight", "createNote");
  }
  const activeTools = (Object.fromEntries(
    Object.entries(agentToolDefs).filter(([name]) => !excludedTools.includes(name))
  ) as typeof agentToolDefs);

  const result = streamText({
    model: model as Parameters<typeof streamText>[0]["model"],
    system: `${SYSTEM_PROMPT}\n\nCurrent canvas state:\n${canvasContext || EMPTY_CANVAS}\n\nCurrent doc state:\n${docContext || EMPTY_DOC}`,
    tools: activeTools,
    messages: await convertToModelMessages(messages),
    ...(isGoogle ? { providerOptions: { google: { thinkingConfig: { includeThoughts: true } } } } : {}),
    onFinish: async () => {
      if (ownerId) await recordPrompt(ownerId, user.id, workspaceId);
    },
  });

  return result.toUIMessageStreamResponse({ sendReasoning: true });
}
