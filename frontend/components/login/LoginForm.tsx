"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { dashboardPathForRole } from "@/lib/data";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [society, setSociety] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await login(society, identifier, password);

    if (!result.success || !result.user) {
      setError(result.message ?? "Unable to sign in. Please try again.");
      setSubmitting(false);
      return;
    }

    router.push(dashboardPathForRole(result.user.role));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Input
        id="society"
        label="Society login code"
        type="text"
        placeholder="e.g. green-valley"
        required
        value={society}
        onChange={(e) => setSociety(e.target.value)}
        autoCapitalize="none"
        autoCorrect="off"
      />

      <Input
        id="identifier"
        label="Email or Phone"
        type="text"
        placeholder="you@example.com or 98XXXXXXXX"
        required
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
      />

      <Input
        id="password"
        label="Password"
        type="password"
        placeholder="••••••••"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && (
        <p role="alert" className="rounded-sm border border-rust/30 bg-rust/10 px-4 py-3 text-sm text-rust">
          {error}
        </p>
      )}

      <Button type="submit" variant="primary" className="mt-2 w-full" disabled={submitting}>
        {submitting ? "Checking the register…" : "Sign in"}
      </Button>
    </form>
  );
}
