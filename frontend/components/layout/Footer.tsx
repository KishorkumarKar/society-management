"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Container from "@/components/ui/Container";

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="border-t border-paper/10 bg-ink">
      <Container className="flex flex-col gap-10 py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div className="flex flex-col gap-3">
            <span className="font-display text-lg text-paper">
              Society<span className="text-brass">Ledger</span>
            </span>
            <p className="max-w-xs text-sm leading-relaxed text-paper/60">
              A single console for running the paperwork, notices and people of
              every society under your management.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <span className="font-mono text-xs uppercase tracking-wider text-brass">
              Product
            </span>
            <Link href="/" className="text-sm text-paper/70 hover:text-paper">Home</Link>
            <Link href="/pricing" className="text-sm text-paper/70 hover:text-paper">Pricing</Link>
            <Link href="/login" className="text-sm text-paper/70 hover:text-paper">Resident Login</Link>
          </div>

          <div className="flex flex-col gap-3">
            <span className="font-mono text-xs uppercase tracking-wider text-brass">
              Company
            </span>
            <Link href="/about" className="text-sm text-paper/70 hover:text-paper">About Us</Link>
            <Link href="/contact" className="text-sm text-paper/70 hover:text-paper">Contact Us</Link>
          </div>

          <div className="flex flex-col gap-3">
            <span className="font-mono text-xs uppercase tracking-wider text-brass">
              Registered Office
            </span>
            <p className="text-sm leading-relaxed text-paper/70">
              4th Floor, Ledger House<br />
              Koramangala, Bengaluru 560034
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-paper/10 pt-6 text-xs text-paper/40 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 SocietyLedger Technologies Pvt. Ltd. All rights reserved.</span>
          <span className="font-mono">Built for housing societies, by housing societies.</span>
        </div>
      </Container>
    </footer>
  );
}
