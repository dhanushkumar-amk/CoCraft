import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Terms and Conditions — CoCraft",
  description: "Terms and conditions of service for CoCraft.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24 md:py-32">
      <div className="mb-8">
        <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
          <Link href="/">
            <ArrowLeft className="size-4" /> Back to Home
          </Link>
        </Button>
      </div>

      <h1 className="font-heading text-4xl font-bold tracking-tight">Terms and Conditions</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: November 18, 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
          <p className="mt-2">
            By accessing or using <strong className="text-foreground">CoCraft</strong> (&ldquo;the Service&rdquo;), operated by <strong className="text-foreground">Dhanush Kumar</strong>, 
            you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. Description of Service</h2>
          <p className="mt-2">
            CoCraft is an AI-powered agentic workspace that enables individuals and teams to collaborate in real time on an infinite whiteboard canvas (diagrams, ERDs, flows) and block-based documentation, assisted by an interactive AI agent.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. User Accounts & Organizations</h2>
          <p className="mt-2">
            You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. When creating team organizations, administrators are responsible for managing member access, permissions, and billing seats.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Intellectual Property & Content Ownership</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li><strong className="text-foreground">Your Content:</strong> You retain full ownership and intellectual property rights over all diagrams, specifications, documents, and data you create within CoCraft.</li>
            <li><strong className="text-foreground">Our Platform:</strong> The CoCraft application, logo, design system, and underlying software are the intellectual property of Dhanush Kumar and licensors.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Subscriptions, Fees & Billing</h2>
          <p className="mt-2">
            CoCraft offers Free and Paid tiers (such as Pro, Team, and Enterprise).
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>Paid subscriptions are billed on a recurring monthly or annual basis.</li>
            <li>Payments are handled securely via our authorized payment partners (e.g. Dodo Payments / Clerk).</li>
            <li>You may cancel your subscription at any time via your account settings. Upon cancellation, your subscription remains active until the end of your current paid billing period.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">6. Acceptable Use</h2>
          <p className="mt-2">
            You agree not to use CoCraft to generate or distribute unlawful, harmful, defamatory, or abusive content, or to attempt to reverse engineer or disrupt the service or its AI integrations.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">7. Limitation of Liability</h2>
          <p className="mt-2">
            CoCraft is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis. In no event shall Dhanush Kumar or CoCraft be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">8. Contact & Queries</h2>
          <p className="mt-2">
            For any legal inquiries regarding these Terms:
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
