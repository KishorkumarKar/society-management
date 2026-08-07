import type { ReactNode } from "react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-ink pb-24 pt-16 sm:pt-24">
      <div className="pointer-events-none absolute inset-0 bg-grain [background-size:18px_18px]" />
      <Container className="relative">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          <div className="flex flex-col gap-6 lg:col-span-6">
            <span className="w-fit rounded-sm border border-brass/40 px-3 py-1 font-mono text-xs uppercase tracking-[0.2em] text-brass">
              Notice No. NB-01 · For every society you manage
            </span>
            <h1 className="font-display text-4xl font-medium leading-[1.1] text-paper sm:text-5xl lg:text-6xl">
              One noticeboard.
              <br />
              Every society you run.
            </h1>
            <p className="max-w-lg text-lg leading-relaxed text-paper/70">
              SocietyLedger keeps residents, committees and paperwork for
              multiple housing societies in one place — each with its own
              login, its own ledger, its own noticeboard.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Button href="/login" variant="primary">
                Sign in to your society
              </Button>
              <Button href="/pricing" variant="secondary">
                See pricing
              </Button>
            </div>
            <p className="pt-1 text-xs text-paper/40">
              Try it — society: <span className="text-brass/80">Greenwood Residency</span>,
              email <span className="text-brass/80">rohan.kulkarni@greenwood.test</span>,
              password <span className="text-brass/80">resident123</span>
            </p>
          </div>

          <div className="lg:col-span-6">
            <div className="relative mx-auto grid max-w-md grid-cols-2 gap-4 sm:max-w-lg">
              <PinnedCard className="col-span-2" pin="brass">
                <span className="font-mono text-[11px] uppercase tracking-widest text-brass">
                  NB-02 · Live across the network
                </span>
                <p className="mt-3 font-display text-2xl text-ink">
                  3 societies, 520 units, one dashboard.
                </p>
              </PinnedCard>
              <PinnedCard pin="sage">
                <span className="font-mono text-[11px] uppercase tracking-widest text-sage">
                  Occupancy
                </span>
                <p className="mt-3 font-display text-3xl text-ink">96%</p>
                <p className="mt-1 text-xs text-ink/50">across managed units</p>
              </PinnedCard>
              <PinnedCard pin="rust">
                <span className="font-mono text-[11px] uppercase tracking-widest text-rust">
                  Open tickets
                </span>
                <p className="mt-3 font-display text-3xl text-ink">12</p>
                <p className="mt-1 text-xs text-ink/50">resolved in 48 hrs avg</p>
              </PinnedCard>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function PinnedCard({
  children,
  className = "",
  pin,
}: {
  children: ReactNode;
  className?: string;
  pin: "brass" | "sage" | "rust";
}) {
  const pinColor =
    pin === "brass" ? "bg-brass" : pin === "sage" ? "bg-sage" : "bg-rust";
  return (
    <div
      className={`relative rounded-sm border border-ink/10 bg-paper p-6 shadow-pin ${className}`}
    >
      <span
        className={`absolute -top-1.5 left-6 h-3 w-3 rounded-full ${pinColor} shadow-sm`}
      />
      {children}
    </div>
  );
}
