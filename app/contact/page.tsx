import Link from "next/link";
import { ArrowLeft, Mail, MessageSquare, Clock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Contact Us — CoCraft",
  description: "Get in touch with the CoCraft team and Dhanush Kumar.",
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24 md:py-32">
      <div className="mb-8">
        <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
          <Link href="/">
            <ArrowLeft className="size-4" /> Back to Home
          </Link>
        </Button>
      </div>

      <h1 className="font-heading text-4xl font-bold tracking-tight">Contact Us</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Have a question, feedback, or need billing support? We&apos;re here to help.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-card p-6">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Mail className="size-5" />
          </div>
          <h3 className="mt-4 font-semibold text-foreground">Direct Email</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            For support, feature inquiries, or billing assistance.
          </p>
          <a
            href="mailto:dhanushkumaramk@gmail.com"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            dhanushkumaramk@gmail.com
          </a>
        </div>

        <div className="rounded-xl border border-white/10 bg-card p-6">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Clock className="size-5" />
          </div>
          <h3 className="mt-4 font-semibold text-foreground">Response Time</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            We typically respond to all inquiries within 24 to 48 hours.
          </p>
          <span className="mt-4 inline-block text-xs font-mono text-muted-foreground">
            Available: Mon – Fri
          </span>
        </div>

        <div className="rounded-xl border border-white/10 bg-card p-6">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MessageSquare className="size-5" />
          </div>
          <h3 className="mt-4 font-semibold text-foreground">Creator</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Created and maintained by:
          </p>
          <p className="mt-3 text-sm font-medium text-foreground">Dhanush Kumar</p>
          <p className="text-xs text-muted-foreground">Full Stack & AI Developer</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-card p-6">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Globe className="size-5" />
          </div>
          <h3 className="mt-4 font-semibold text-foreground">Community & Updates</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Follow product updates, roadmap announcements, and new feature releases.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            CoCraft Agentic Workspace Platform
          </p>
        </div>
      </div>
    </main>
  );
}
