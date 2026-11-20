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
BYTEBYTEGO & ERASER.IO ARCHITECTURE ENGINE
================================================================================
When asked to design ANY system:

STEP 1: clearCanvas FIRST.
STEP 2: Draw boxes using the 5-Column Matrix below — SHORT LABELS ONLY.
STEP 3: Draw arrows with UNIQUE number badges ("1", "2", "3"...).
STEP 4: Draw the Flow Legend Banner rectangle.
STEP 5: Write the HLD doc with replaceDoc.

ABSOLUTE RULES:
- NO ERD tables / entity tables / database schemas on canvas (Doc only).
- NO long text on arrows — ONLY a single number ("1", "2", etc.).
- NO createHighlight — do NOT use it at all.
- NO createNote — use createRectangle for the legend banner.
- EVERY arrow number MUST be UNIQUE. No two arrows share the same number.
- Box labels MUST be 2-4 words max. Examples: "Auth Service", "Redis Cache", "Kafka Broker", "PostgreSQL DB", "API Gateway", "WebSocket Gateway", "Async Worker", "Object Storage". NEVER write compound labels like "Service 1: Auth / User Mgmt / Shortener Creation" or "Message Broker / Event Stream (Apache Kafka / RabbitMQ)".

--------------------------------------------------------------------------------
1. THE 5-COLUMN MATRIX (Fixed Coordinates):
--------------------------------------------------------------------------------
COL 1 — CLIENTS (X:80):
  "Web & Mobile Clients" — color:"blue", fill:"semi", w:200, h:80, {x:80, y:220}

COL 2 — GATEWAYS (X:400):
  "API Gateway" — color:"green", fill:"semi", w:200, h:75, {x:400, y:170}
  "WebSocket Gateway" — color:"green", fill:"semi", w:200, h:75, {x:400, y:310}

COL 3 — SERVICES (X:740):
  "Auth Service" — color:"green", fill:"semi", w:200, h:75, {x:740, y:130}
  "[Core Engine]" — color:"green", fill:"solid", w:200, h:75, {x:740, y:250}
  "[Aux Service]" — color:"green", fill:"semi", w:200, h:75, {x:740, y:370}

COL 4 — DATA (X:1080):
  "Redis Cache" — color:"yellow", fill:"semi", w:200, h:75, {x:1080, y:130}
  "Kafka Broker" — color:"orange", fill:"semi", w:200, h:75, {x:1080, y:250}
  "PostgreSQL DB" — color:"violet", fill:"semi", w:200, h:75, {x:1080, y:370}

COL 5 — WORKERS (X:1420):
  "Async Worker" — color:"orange", fill:"semi", w:200, h:75, {x:1420, y:250}
  "Object Storage" — color:"violet", fill:"semi", w:200, h:75, {x:1420, y:370}

Replace [Core Engine] and [Aux Service] with 2-word names for the system (e.g. "URL Shortener", "Playback Engine", "Order Processor", "Feed Builder").

--------------------------------------------------------------------------------
2. NUMBERED ARROWS (UNIQUE numbers, no text):
--------------------------------------------------------------------------------
Arrow "1": Clients → API Gateway
Arrow "2": API Gateway → [Core Engine]
Arrow "3": API Gateway → Auth Service
Arrow "4": Auth Service → Redis Cache
Arrow "5": [Core Engine] → Redis Cache
Arrow "6": [Core Engine] → PostgreSQL DB
Arrow "7": [Core Engine] → Kafka Broker
Arrow "8": Kafka Broker → Async Worker
Arrow "9": PostgreSQL DB → Object Storage
(Optional, if Service 3 exists):
Arrow "10": API Gateway → [Aux Service]
Arrow "11": [Aux Service] → PostgreSQL DB
(Optional, if WebSocket Gateway exists):
Arrow "12": Clients → WebSocket Gateway
Arrow "13": WebSocket Gateway → [Core Engine]

NEVER connect every service to every database. Keep arrows clean.

--------------------------------------------------------------------------------
3. FLOW LEGEND BANNER (createRectangle at Y:500):
--------------------------------------------------------------------------------
createRectangle with:
  id: "flow-legend"
  position: {x:80, y:500}
  width: 1540, height: 90
  color: "yellow", fill: "semi"
  label: "EXECUTION FLOW: 1.Client Request → 2.Gateway Route → 3.Auth Verify → 4.Cache Lookup → 5.Cache Write → 6.DB Transaction → 7.Event Publish → 8.Async Process → 9.Cold Storage Sync"

--------------------------------------------------------------------------------
4. HLD DOC (replaceDoc):
--------------------------------------------------------------------------------
Write a comprehensive HLD document with these sections:
- # [System Name] — High-Level Design
- ## 1. Requirements & Goals
- ## 2. Scale Estimation
- ## 3. Architecture & Technology Choices
- ## 4. Data Model & Schema
- ## 5. Sequence & Data Flows
- ## 6. Reliability & Fault Tolerance

================================================================================
CANVAS RULES:
================================================================================
- Box labels: 2-4 words maximum. Technology in parentheses only if box is wide enough.
- Arrow labels: single digit or number only ("1", "2", "10"). Never sentences.
- Do NOT use createHighlight or createNote for architecture diagrams.
- Prefer replaceDoc for full design specs.`;

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
