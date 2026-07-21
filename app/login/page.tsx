"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setError(error.message || "Invalid email or password.");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Could not reach the server. Please check your connection and try again.");
      console.error("Login error:", err);
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm space-y-4">
        <h1 className="font-display text-xl font-bold">Sign in</h1>

        <div>
          <label className="text-mist text-sm">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full mt-1 bg-night border border-white/10 rounded-lg px-3 py-2 text-white"
          />
        </div>

        <div>
          <label className="text-mist text-sm">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full mt-1 bg-night border border-white/10 rounded-lg px-3 py-2 text-white"
          />
        </div>

        {error && <p className="text-danger text-sm">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <div className="flex justify-between text-sm pt-2">
          <a href="/forgot-password" className="text-mint underline">Forgot password?</a>
          <a href="/signup" className="text-mist underline">Create an account</a>
        </div>
      </form>
    </main>
  );
}
