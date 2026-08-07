import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import LoginForm from "@/components/login/LoginForm";

export const metadata: Metadata = {
  title: "Sign In — SocietyLedger",
  description: "Sign in to your society's noticeboard and ledger.",
};

export default function LoginPage() {
  return (
    <section className="bg-ink py-20">
      <Container className="flex justify-center">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center gap-2 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-sm border border-brass/40 font-display text-lg text-brass">
              ID
            </span>
            <h1 className="font-display text-2xl text-paper">Society sign in</h1>
            <p className="text-sm text-paper/60">
              Choose your society, then sign in with your registered email or phone.
            </p>
          </div>
          <Card className="p-8">
            <LoginForm />
          </Card>
          <p className="mt-6 text-center text-xs text-paper/40">
            Trouble signing in? Reach your committee, or{" "}
            <a href="/contact" className="text-brass hover:underline">
              contact support
            </a>
            .
          </p>
        </div>
      </Container>
    </section>
  );
}
