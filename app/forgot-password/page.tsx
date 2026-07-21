"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="card w-full max-w-sm space-y-4">
        <h1 className="font-display text-xl font-bold">Reset your password</h1>

        {sent ? (
          <p className="text-mint text-sm">
            If an account exists for {email}, a reset link has been sent. Check your inbox
            (and spam folder) and click the link to set a new password.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-mist text-sm">
              Enter the email you signed up with — we'll send you a link to set a new password.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full bg-night border border-white/10 rounded-lg px-3 py-2 text-white"
            />
            {error && <p className="text-danger text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <a href="/login" className="text-mist text-sm underline block text-center pt-2">Back to sign in</a>
      </div>
    </main>
  );
}
