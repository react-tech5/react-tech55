"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function SignupForm() {
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "company" ? "company" : "commenter";

  const [role, setRole] = useState<"company" | "commenter">(initialRole);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Keep role in sync if the query param changes after the page has already mounted
  useEffect(() => {
    const paramRole = searchParams.get("role");
    if (paramRole === "company" || paramRole === "commenter") {
      setRole(paramRole);
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role, full_name: fullName }, // read by the handle_new_user() trigger in Supabase
        },
      });

      if (error) {
        setError(error.message || "Something went wrong. Please try again.");
      } else {
        setSent(true);
      }
    } catch (err) {
      // Catches network-level failures (e.g. misconfigured Supabase keys) that
      // don't come back as a normal Supabase error object.
      setError("Could not reach the server. Please check your connection and try again.");
      console.error("Signup error:", err);
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="card w-full max-w-sm space-y-4">
        <h1 className="font-display text-xl font-bold">Create your account</h1>

        {sent ? (
          <p className="text-mint text-sm">
            Almost there — check {email} for a confirmation link to activate your account.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("commenter")}
                className={`py-2 rounded-lg text-sm font-semibold border ${role === "commenter" ? "border-mint text-mint bg-mint/10" : "border-white/10 text-mist"}`}
              >
                I'm a commenter
              </button>
              <button
                type="button"
                onClick={() => setRole("company")}
                className={`py-2 rounded-lg text-sm font-semibold border ${role === "company" ? "border-mint text-mint bg-mint/10" : "border-white/10 text-mist"}`}
              >
                I'm a client
              </button>
            </div>

            <div>
              <label className="text-mist text-sm">Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full mt-1 bg-night border border-white/10 rounded-lg px-3 py-2 text-white"
              />
            </div>
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
                minLength={8}
                className="w-full mt-1 bg-night border border-white/10 rounded-lg px-3 py-2 text-white"
              />
            </div>

            {error && <p className="text-danger text-sm">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
        )}

        <a href="/login" className="text-mist text-sm underline block text-center pt-2">Already have an account? Sign in</a>
      </div>
    </main>
  );
}

export default function Signup() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
