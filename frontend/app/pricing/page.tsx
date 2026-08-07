import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import { plans } from "@/lib/data";

export const metadata: Metadata = {
  title: "Pricing — SocietyLedger",
  description: "Plans for a single society or a whole federation of them.",
};

export default function PricingPage() {
  return (
    <section className="bg-ink py-20">
      <Container className="flex flex-col gap-14">
        <SectionHeading
          eyebrow="Notice No. NB-30 · Pricing"
          title="Priced by the society, not by the headache"
          description="Every plan includes the noticeboard and directory. Pick the tier that matches how many units — and how many societies — you run."
          align="center"
          tone="light"
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`flex flex-col gap-6 rounded-sm border p-8 ${
                plan.highlighted
                  ? "border-brass bg-ink-light shadow-pin"
                  : "border-paper/10 bg-ink-light/40"
              }`}
            >
              {plan.highlighted && (
                <span className="w-fit rounded-sm bg-brass px-3 py-1 font-mono text-xs uppercase tracking-wider text-ink">
                  Most chosen
                </span>
              )}
              <div className="flex flex-col gap-1">
                <h3 className="font-display text-2xl text-paper">{plan.name}</h3>
                <p className="text-sm text-paper/60">{plan.tagline}</p>
              </div>

              <div className="flex items-end gap-2">
                {plan.price !== null ? (
                  <>
                    <span className="font-display text-4xl text-paper">₹{plan.price.toLocaleString("en-IN")}</span>
                    <span className="pb-1 text-sm text-paper/50">/ society</span>
                  </>
                ) : (
                  <span className="font-display text-4xl text-paper">Custom</span>
                )}
              </div>
              <p className="-mt-4 font-mono text-xs uppercase tracking-wider text-brass">
                {plan.billing}
              </p>
              <p className="text-sm text-paper/70">{plan.unitCap}</p>

              <ul className="flex flex-col gap-3 border-t border-paper/10 pt-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-paper/70">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brass" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                href="/contact"
                variant={plan.highlighted ? "primary" : "secondary"}
                className="mt-auto w-full"
              >
                {plan.price !== null ? "Get started" : "Talk to sales"}
              </Button>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-paper/40">
          All prices in INR, exclusive of applicable taxes. Managing multiple
          societies? The Federation plan gives every one of them its own
          login inside the same console.
        </p>
      </Container>
    </section>
  );
}
