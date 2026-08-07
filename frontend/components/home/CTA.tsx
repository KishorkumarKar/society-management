import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

export default function CTA() {
  return (
    <section className="bg-ink py-24">
      <Container>
        <div className="flex flex-col items-center gap-6 rounded-sm border border-brass/30 bg-ink-light px-8 py-16 text-center">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass">
            Notice No. NB-99 · Final call
          </span>
          <h2 className="max-w-2xl font-display text-3xl font-medium text-paper sm:text-4xl">
            Bring your committee&apos;s paperwork onto one board.
          </h2>
          <p className="max-w-xl text-paper/70">
            Set up your society in an afternoon, invite your committee, and
            retire the shared spreadsheet for good.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Button href="/pricing" variant="primary">
              View pricing
            </Button>
            <Button href="/contact" variant="secondary">
              Talk to us
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
