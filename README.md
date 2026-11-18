# CoCraft

**An AI-powered agentic workspace: collaborate with an intelligent AI agent that draws live diagrams on an infinite canvas and writes rich documents, while you and your team work alongside it in real time.**

Created and developed by **Dhanush Kumar**.

---

## 🌟 Key Features

- **Dual-Surface Agent**: Chat with an AI agent that works across both a visual canvas (infinite whiteboard) and a collaborative document editor. Ask for *"a database schema and documentation"* and it generates the ERD table shapes on the canvas and writes the specification in the doc simultaneously.
- **Interactive Whiteboard (tldraw)**: Custom ERD table shapes with editable columns, primary/foreign key badges, and connector lines that snap to individual rows.
- **Collaborative Docs (BlockNote & Yjs)**: Live multi-user cursors and rich-text blocks synced with Supabase Realtime.
- **Real-Time Collaboration**: Real-time canvas collaboration with multi-user cursors via tldraw sync.
- **Teams & Organizations**: Multi-tenancy powered by Clerk Organizations (personal workspaces + team shared workspaces).
- **Interactive Dashboard & Kanban**: Track workspaces from planning to completion with drag-and-drop status boards.
- **Read-Only Sharing & PDF Export**: Instant shareable read-only links and high-fidelity PDF exports.
- **Global Billing & Subscriptions**: Flexible billing options supporting international and Indian payments (Dodo Payments / Clerk Billing).

---

## 🛠️ Tech Stack

| Area | Technologies |
|---|---|
| **Framework** | Next.js (App Router, Server Actions, Turbopack) |
| **Language** | TypeScript |
| **Authentication & Orgs** | Clerk (Organizations & User Management) |
| **Database & Realtime** | Supabase (PostgreSQL & Realtime Broadcast Channels) |
| **ORM** | Prisma ORM |
| **AI Engine** | Vercel AI SDK with Google Gemini 2.5/Flash |
| **Canvas** | tldraw with Custom Shape Extensions |
| **Document Editor** | BlockNote, ProseMirror, Yjs |
| **UI & Styling** | Tailwind CSS v4, Radix UI, Lucide Icons, Sonner |
| **Payments & MoR** | Dodo Payments / Clerk Billing |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 22 or later
- npm or pnpm
- Accounts on:
  - [Clerk](https://clerk.com) (Authentication)
  - [Supabase](https://supabase.com) (PostgreSQL Database & Realtime)
  - [Google AI Studio](https://aistudio.google.com/apikey) (Gemini API Key)
  - [Dodo Payments](https://dodopayments.com) (Global & Indian Payments)

---

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url> cocraft
   cd cocraft
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   Fill in your `.env` values:
   ```env
   # Clerk Auth
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
   NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard

   # Supabase Database (PostgreSQL)
   DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

   # Supabase Realtime
   NEXT_PUBLIC_SUPABASE_URL=https://[REF].supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...

   # Google Gemini AI
   GOOGLE_GENERATIVE_AI_API_KEY=...

   # Dodo Payments (Global & India)
   DODO_PAYMENTS_API_KEY=test_...
   DODO_PAYMENTS_WEBHOOK_KEY=whsec_...
   DODO_PAYMENTS_ENVIRONMENT=test_mode
   ```

4. **Deploy Database Schema:**
   ```bash
   npx prisma migrate deploy
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
app/
  page.tsx                  # Landing page
  (main)/dashboard/         # User dashboard and quick actions
  (main)/workspaces/        # Kanban board of all workspaces
  (main)/workspace/[id]/    # Workspace: canvas, collaborative doc, and AI chat
  shared/[token]/           # Public read-only workspace view
  privacy/                  # Privacy policy page
  terms/                    # Terms and conditions page
  refund/                   # Refund and cancellation policy page
  contact/                  # Contact us page
  api/agent/                # AI Agent backend endpoint (Gemini + tools)
actions/                    # Next.js Server Actions (workspaces, docs, canvas)
components/                 # Shared UI components & custom tldraw shapes
lib/                        # Utility functions, Prisma client, AI tools
prisma/                     # Database schema and migration history
```

---

## ⚖️ Legal & Compliance

- **Privacy Policy**: [CoCraft Privacy Policy](/privacy)
- **Terms & Conditions**: [CoCraft Terms](/terms)
- **Refund Policy**: [CoCraft Refund Policy](/refund)
- **Contact Us**: [CoCraft Contact](/contact)

---

## 📬 Contact & Support

Developed by **Dhanush Kumar**.
- **Email**: [dhanushkumaramk@gmail.com](mailto:dhanushkumaramk@gmail.com)
- **Project**: CoCraft Agentic Workspace

---

## 📄 License

This project is licensed under the [GPL-3.0 License](LICENSE).
