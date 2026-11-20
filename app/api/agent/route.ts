import { google } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { agentToolDefs } from "@/lib/agent-tools";
import { PROMPT_LIMIT_ERROR } from "@/lib/plan-limits";
import { checkUser } from "@/actions/check-user";
import { canAccessWorkspace } from "@/lib/workspace-access";
import { getPromptUsage, getWorkspaceOwnerId, recordPrompt } from "@/lib/billing";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

function selectModel() {
  const provider = (process.env.AI_PROVIDER || (process.env.OPENROUTER_API_KEY ? "openrouter" : "google")).toLowerCase();

  if (provider === "google") {
    return {
      isGoogle: true,
      model: google(process.env.GEMINI_MODEL || "gemini-2.5-flash"),
    };
  }

  // OpenRouter (Open-Source Models: default openrouter/free)
  const modelName = process.env.OPENROUTER_MODEL || "openrouter/free";
  return {
    isGoogle: false,
    model: openrouter(modelName),
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
1. systemName: e.g. "URL Shortener Distributed Architecture"
2. columns: 5 tiers from left to right:
   - Tier 1 "Clients": nodes: [{ id: "clients", label: "Web & Mobile Clients", tech: "Next.js / iOS" }]
   - Tier 2 "Ingress": nodes: [{ id: "api-gw", label: "API Gateway", tech: "Kong / Envoy" }, { id: "ws-gw", label: "WebSocket Gateway", tech: "WSS Ingress" }]
   - Tier 3 "Services": nodes: [{ id: "auth-svc", label: "Auth Service", tech: "Go / JWT" }, { id: "core-engine", label: "[Core Engine]", tech: "Java / Go" }, { id: "aux-svc", label: "[Auxiliary Service]", tech: "Python / Node" }]
   - Tier 4 "Data Stack": nodes: [{ id: "cache", label: "In-Memory Cache", tech: "Redis Cluster" }, { id: "broker", label: "Message Broker", tech: "Apache Kafka" }, { id: "db", label: "Primary Database", tech: "PostgreSQL" }]
   - Tier 5 "Workers": nodes: [{ id: "worker", label: "Async Consumer", tech: "Worker Pool" }, { id: "storage", label: "Object Storage", tech: "S3 / Cold Store" }]
3. connections: Sequential request flow with UNIQUE stepNumber (1, 2, 3, 4, 5...):
   - 1: clients → api-gw ("Client HTTPS Request")
   - 2: api-gw → auth-svc ("Token Verification")
   - 3: api-gw → core-engine ("Route Request")
   - 4: auth-svc → cache ("Session Lookup")
   - 5: core-engine → cache ("Cache Query / Hit")
   - 6: core-engine → db ("ACID DB Transaction")
   - 7: core-engine → broker ("Publish Event")
   - 8: broker → worker ("Async Processing")
   - 9: db → storage ("Cold Sync / Backup")
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
    model,
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
