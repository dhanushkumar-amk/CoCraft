import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Privacy Policy — CoCraft",
  description: "Privacy policy and data collection terms for CoCraft.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24 md:py-32">
      <div className="mb-8">
        <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
          <Link href="/">
            <ArrowLeft className="size-4" /> Back to Home
          </Link>
        </Button>
      </div>

      <h1 className="font-heading text-4xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: November 18, 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Introduction</h2>
          <p className="mt-2">
            Welcome to <strong className="text-foreground">CoCraft</strong> (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;), operated by <strong className="text-foreground">Dhanush Kumar</strong>. 
            We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains what information we collect, how we use it, and your rights in relation to it.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. Information We Collect</h2>
          <p className="mt-2">We collect information that you provide directly to us when using CoCraft:</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li><strong className="text-foreground">Account Information:</strong> Your name, email address, profile picture, and organization details provided during authentication via Clerk.</li>
            <li><strong className="text-foreground">Workspace Content:</strong> The diagrams, entity-relationship tables, documents, text, and chat messages you and your team create inside workspaces.</li>
            <li><strong className="text-foreground">AI Prompts & Instructions:</strong> Prompts sent to the AI agent to generate canvas shapes or write documentation.</li>
            <li><strong className="text-foreground">Billing & Payment Data:</strong> Subscription plan records and customer identifiers processed securely via our payment providers (Dodo Payments / Clerk). We do not store your raw credit card numbers.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. How We Use Your Information</h2>
          <p className="mt-2">We use your information to:</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>Provide, maintain, and improve the CoCraft real-time collaborative workspace.</li>
            <li>Process AI requests using Google Gemini to draft diagrams and text documents according to your instructions.</li>
            <li>Manage team memberships, subscriptions, and usage quotas.</li>
            <li>Send essential transactional notifications regarding your account or workspace invites.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Third-Party Sub-processors</h2>
          <p className="mt-2">
            To provide our services, we share necessary data with trusted third-party service providers:
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li><strong className="text-foreground">Clerk:</strong> For identity verification, authentication, and team organizations.</li>
            <li><strong className="text-foreground">Supabase (PostgreSQL & Realtime):</strong> For secure database hosting and real-time collaboration.</li>
            <li><strong className="text-foreground">Google AI (Gemini):</strong> For processing agent prompts and tool execution. Prompts are transmitted securely to generate whiteboard shapes and specs.</li>
            <li><strong className="text-foreground">Dodo Payments:</strong> For compliant recurring billing and merchant-of-record subscription handling.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Data Retention & Security</h2>
          <p className="mt-2">
            Your data is stored securely using industry-standard encryption protocols in transit and at rest. You retain full ownership of your workspace content and can delete workspaces at any time.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">6. Contact Us</h2>
          <p className="mt-2">
            If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact:
          </p>
          <div className="mt-3 rounded-lg border border-white/10 bg-card p-4 text-foreground">
            <p className="font-medium">Dhanush Kumar</p>
            <p className="text-sm text-muted-foreground">Founder & Developer, CoCraft</p>
            <p className="mt-1 text-sm">
              Email: <a href="mailto:dhanushkumaramk@gmail.com" className="text-primary underline">dhanushkumaramk@gmail.com</a>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
