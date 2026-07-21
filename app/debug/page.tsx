"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Debug() {
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "❌ NOT SET";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "❌ NOT SET";
  const urlLooksValid = url.startsWith("https://") && url.includes(".supabase.co");
  const keyLooksValid = key.startsWith("sb_publishable_") || key.startsWith("eyJ");

  async function runLiveTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setTestResult(`❌ Supabase responded with an error: ${error.message}`);
      } else {
        setTestResult("✅ Successfully connected to Supabase! Auth is reachable.");
      }
    } catch (err: any) {
      setTestResult(`❌ Network-level failure: ${err?.message || "Failed to fetch — could not reach Supabase at all."}`);
    }
    setTesting(false);
  }

  return (
    <main className="min-h-screen bg-night text-white px-6 py-10 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">🔍 Connection Diagnostics</h1>
      <p className="text-mist text-sm">
        This page checks (without guessing) whether your environment variables are actually
        reaching the deployed site, and whether Supabase itself responds.
      </p>

      <div className="bg-petrol rounded-xl p-5 space-y-4">
        <div>
          <p className="text-mist text-xs mb-1">NEXT_PUBLIC_SUPABASE_URL</p>
          <p className="font-mono text-sm break-all">{url}</p>
          <p className={`text-xs mt-1 ${urlLooksValid ? "text-mint" : "text-danger"}`}>
            {urlLooksValid ? "✅ Format looks correct" : "❌ Missing or wrong format — should start with https:// and end in .supabase.co"}
          </p>
        </div>

        <div>
          <p className="text-mist text-xs mb-1">NEXT_PUBLIC_SUPABASE_ANON_KEY (first 20 chars)</p>
          <p className="font-mono text-sm break-all">{key.slice(0, 20)}...</p>
          <p className={`text-xs mt-1 ${keyLooksValid ? "text-mint" : "text-danger"}`}>
            {keyLooksValid ? "✅ Format looks correct" : "❌ Missing or wrong format — should start with sb_publishable_ or eyJ"}
          </p>
        </div>
      </div>

      <button
        onClick={runLiveTest}
        disabled={testing}
        className="bg-mint text-night font-bold px-6 py-3 rounded-xl disabled:opacity-50"
      >
        {testing ? "Testing..." : "Run live connection test"}
      </button>

      {testResult && (
        <div className="bg-petrol rounded-xl p-4 text-sm font-mono break-all">{testResult}</div>
      )}

      <div className="text-mist text-xs border-t border-white/10 pt-4 space-y-1">
        <p>👉 If either value above shows "NOT SET" or "wrong format": the environment variables aren't reaching Vercel correctly. Fix them in Vercel → Settings → Environment Variables, then Redeploy.</p>
        <p>👉 If both look correct but the live test still fails: the Supabase project itself may be paused, or the key was copied incompletely.</p>
      </div>
    </main>
  );
}
