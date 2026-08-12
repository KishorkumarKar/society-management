import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import Badge from "@/components/ui/Badge";
import { societies } from "@/lib/data";

export default function SocietiesShowcase() {
  return (
    <section className="bg-paper py-24">
      <Container className="flex flex-col gap-14">
        <SectionHeading
          eyebrow="On the network"
          title="Three societies, three registers, one system"
          description="Each society keeps its own residents, notices and ledger — visible only to its own members."
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {societies.map((society) => (
            <div
              key={society.id}
              className="flex flex-col gap-5 rounded-sm border border-ink/10 bg-paper p-7 shadow-pin"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-sm bg-ink font-display text-sm text-brass">
                  {society.initial}
                </span>
                <Badge tone="sage">Est. {society.established}</Badge>
              </div>
              <div>
                <h3 className="font-display text-xl text-ink">{society.name}</h3>
                <p className="mt-1 text-sm text-ink/50">{society.city}</p>
              </div>
              <dl className="grid grid-cols-2 gap-4 border-t border-ink/10 pt-5 text-sm">
                <div>
                  <dt className="font-mono text-[11px] uppercase tracking-wider text-ink/40">
                    Units
                  </dt>
                  <dd className="mt-1 font-display text-lg text-ink">
                    {society.totalUnits}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[11px] uppercase tracking-wider text-ink/40">
                    Occupied
                  </dt>
                  <dd className="mt-1 font-display text-lg text-ink">
                    {Math.round((society.occupiedUnits / society.totalUnits) * 100)}%
                  </dd>
                </div>
              </dl>
              <p className="font-mono text-[11px] text-ink/40">
                Reg. {society.registrationNo}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
