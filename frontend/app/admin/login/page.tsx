"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AdminLoginPage() {
  const router = useRouter();
  const { admin, adminLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (admin) {
    router.replace("/admin/dashboard");
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = adminLogin(email, password);
    if (res.success) {
      router.replace("/admin/dashboard");
    } else {
      setError(res.message || "Login failed");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-dark">
      <div className="w-full max-w-sm bg-ink-light border border-ink-light/50 p-8 shadow-pin">
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl italic text-paper">SocietyLedger</h1>
          <p className="text-sm text-muted mt-1">Admin Console</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-muted">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="superadmin@societyledger.com"
              className="mt-1 w-full border border-ink-light/50 bg-ink-dark text-paper px-3 py-2.5 text-sm focus:border-brass outline-none placeholder:text-muted/50"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-muted">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full border border-ink-light/50 bg-ink-dark text-paper px-3 py-2.5 text-sm focus:border-brass outline-none placeholder:text-muted/50"
            />
          </div>

          {error && <p className="text-xs text-rust">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brass text-ink font-semibold text-sm uppercase tracking-wide py-2.5 hover:bg-brass-light transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-ink-light/30 text-xs text-muted text-center space-y-1">
          <p>Demo credentials:</p>
          <p><span className="text-brass">superadmin@societyledger.com</span> / admin123</p>
          <p><span className="text-brass">Any admin email</span> / admin123</p>
        </div>
      </div>
    </div>
  );
}