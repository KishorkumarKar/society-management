import Container from "@/components/ui/Container";
import { societies, users } from "@/lib/data";

export default function Stats() {
  const totalUnits = societies.reduce((sum, s) => sum + s.totalUnits, 0);
  const occupiedUnits = societies.reduce((sum, s) => sum + s.occupiedUnits, 0);
  const occupancyRate = Math.round((occupiedUnits / totalUnits) * 100);

  const stats = [
    { label: "Societies on the ledger", value: societies.length.toString() },
    { label: "Managed units", value: totalUnits.toString() },
    { label: "Registered residents & staff", value: users.length.toString() },
    { label: "Average occupancy", value: `${occupancyRate}%` },
  ];

  return (
    <section className="border-y border-ink/10 bg-paper-dim bg-paper">
      <Container className="grid grid-cols-2 divide-x divide-y divide-ink/10 border-l border-t border-ink/10 sm:grid-cols-4 sm:divide-y-0">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-2 border-b border-r border-ink/10 px-6 py-8">
            <span className="font-display text-3xl text-ink sm:text-4xl">{stat.value}</span>
            <span className="text-xs uppercase tracking-wide text-ink/50">{stat.label}</span>
          </div>
        ))}
      </Container>
    </section>
  );
}
