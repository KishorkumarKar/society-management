import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";

const FEATURES = [
  {
    code: "NB-11",
    title: "Digital noticeboard",
    description:
      "Post AGM notices, maintenance shutdowns and events once — every resident of that society sees it instantly.",
  },
  {
    code: "NB-12",
    title: "Member & unit directory",
    description:
      "Every flat, wing and role — admin, committee, resident, security — kept current without a spreadsheet in sight.",
  },
  {
    code: "NB-13",
    title: "Maintenance ledger",
    description:
      "Track dues, receipts and outstanding balances per unit, per society, without mixing up the books.",
  },
  {
    code: "NB-14",
    title: "Visitor & gate log",
    description:
      "Security desks log entries against the right society and unit, with a searchable history for every gate.",
  },
  {
    code: "NB-15",
    title: "Complaint ticketing",
    description:
      "Residents raise issues, committees assign and close them, and nothing sits unread in an inbox.",
  },
  {
    code: "NB-16",
    title: "Multi-society admin console",
    description:
      "Society admins manage their own book; a super admin oversees every society from one role-based panel.",
  },
];

export default function Features() {
  return (
    <section className="bg-ink py-24">
      <Container className="flex flex-col gap-14">
        <SectionHeading
          eyebrow="What's pinned to the board"
          title="Everything a managing committee actually uses"
          description="Built around the paperwork societies already keep — just faster to find, and impossible to lose."
          tone="light"
        />
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-sm border border-paper/10 bg-paper/10 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.code} className="flex flex-col gap-3 bg-ink p-8">
              <span className="font-mono text-xs uppercase tracking-wider text-brass">
                {feature.code}
              </span>
              <h3 className="font-display text-xl text-paper">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-paper/60">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
