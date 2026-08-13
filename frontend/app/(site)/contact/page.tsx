import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import Card from "@/components/ui/Card";
import ContactForm from "@/components/home/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us — SocietyLedger",
  description: "Get in touch about onboarding your society or federation.",
};

const CONTACT_POINTS = [
  { label: "Sales & onboarding", value: "hello@societyledger.test" },
  { label: "Support desk", value: "support@societyledger.test" },
  { label: "Phone", value: "+91 80 4567 1122" },
  { label: "Office hours", value: "Mon–Sat, 9 AM – 7 PM IST" },
];

export default function ContactPage() {
  return (
    <section className="bg-paper py-20">
      <Container className="grid grid-cols-1 gap-14 lg:grid-cols-12">
        <div className="flex flex-col gap-8 lg:col-span-5">
          <SectionHeading
            eyebrow="Notice No. NB-40 · Get in touch"
            title="Tell us about your society"
            description="Whether it's one building or a whole federation, we'll help you find the right plan and get your committee onboarded."
          />
          <div className="flex flex-col gap-4">
            {CONTACT_POINTS.map((point) => (
              <Card key={point.label} className="flex items-center justify-between p-5">
                <span className="font-mono text-xs uppercase tracking-wider text-ink/40">
                  {point.label}
                </span>
                <span className="text-sm text-ink">{point.value}</span>
              </Card>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7">
          <Card className="p-8">
            <ContactForm />
          </Card>
        </div>
      </Container>
    </section>
  );
}
