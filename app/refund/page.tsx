import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Refund Policy — CoCraft",
  description: "Cancellation and refund policies for CoCraft subscriptions.",
};

export default function RefundPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24 md:py-32">
      <div className="mb-8">
        <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
          <Link href="/">
            <ArrowLeft className="size-4" /> Back to Home
          </Link>
        </Button>
      </div>

      <h1 className="font-heading text-4xl font-bold tracking-tight">Refund & Cancellation Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: November 18, 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Overview</h2>
          <p className="mt-2">
            At <strong className="text-foreground">CoCraft</strong>, we want to ensure you have a transparent and satisfying experience. 
            Because CoCraft provides immediate digital access to AI compute and real-time collaboration tools, this policy outlines our refund and cancellation terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. 7-Day Money-Back Guarantee</h2>
          <p className="mt-2">
            If you are not satisfied with your paid plan (Pro or Team), you are eligible for a <strong className="text-foreground">full refund within 7 days</strong> of your initial purchase or upgrade. 
            Simply reach out to us within 7 calendar days of your payment date, and we will process your refund with no hassle.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Subscription Cancellation</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>You can cancel your subscription at any time directly through your CoCraft workspace settings or account portal.</li>
            <li>When you cancel, your subscription will not renew at the next billing cycle.</li>
            <li>You will continue to have full access to all paid features (unlimited workspaces, increased prompt limits, PDF export) until the end of your current paid billing period.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Refund Processing</h2>
          <p className="mt-2">
            Approved refunds are credited back to the original payment method used during checkout (processed via Dodo Payments). Refunds typically reflect in your bank account or card statement within 5 to 10 business days depending on your bank.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. How to Request a Refund</h2>
          <p className="mt-2">
            To request a refund or if you were charged accidentally, please send an email with your account email address and invoice details to:
          </p>
          <div className="mt-3 rounded-lg border border-white/10 bg-card p-4 text-foreground">
            <p className="font-medium">Dhanush Kumar</p>
            <p className="text-sm text-muted-foreground">CoCraft Support & Billing</p>
            <p className="mt-1 text-sm">
              Email: <a href="mailto:dhanushkumaramk@gmail.com" className="text-primary underline">dhanushkumaramk@gmail.com</a>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
