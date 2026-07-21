"use client";
import { useState } from "react";
import { Badge } from "@/lib/ui";

const packages = [
  { id: 1, name: "Starter", price: 149, comments: 100 },
  { id: 2, name: "Growth", price: 370, comments: 300 },
  { id: 3, name: "Pro", price: 730, comments: 600 },
];

// Sample data — replace with client_revenue_detail query in production
const current = {
  packageId: 1,
  commentsUsed: 85,
  commentsTotal: 100,
  endDate: "2026-07-20",
  quality: { Starter: 40, Pro: 30, Elite: 15 },
};

const taskLog = [
  { platform: "TikTok", commenter: "Sarah (Elite)", status: "approved", date: "2026-07-03" },
  { platform: "Instagram", commenter: "Fahad (Pro)", status: "approved", date: "2026-07-02" },
  { platform: "Twitter/X", commenter: "Mona (Starter)", status: "rejected", date: "2026-07-01" },
];

function exportMonthlyReport() {
  const header = "Platform,Commenter,Status,Date\n";
  const rows = taskLog.map((t) => `${t.platform},${t.commenter},${t.status === "approved" ? "Completed" : "Not completed"},${t.date}`).join("\n");
  const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `comments_report_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ClientDashboard() {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const currentPkg = packages.find((p) => p.id === current.packageId)!;
  const higherPlans = packages.filter((p) => p.price > currentPkg.price);
  const remaining = current.commentsTotal - current.commentsUsed;

  function requestUpgrade(target: (typeof packages)[number]) {
    // In production: await supabase.rpc('upgrade_company_package', { p_company: userId, p_new_package_id: target.id })
    setMsg(`Your ${target.name} plan will activate instantly for a $17 upgrade fee. Your remaining ${remaining} comments carry over automatically.`);
    setShowUpgrade(false);
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      <h1 className="font-display text-3xl font-bold">Client Dashboard</h1>

      <div className="card space-y-4">
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div>
            <p className="text-mist text-sm">Current plan</p>
            <h2 className="font-display text-2xl font-bold text-sand">{currentPkg.name}</h2>
            <p className="text-mist text-sm mt-1">Renews on {current.endDate}</p>
          </div>
          <Badge text={`${remaining} comments left`} tone={remaining > 10 ? "mint" : "danger"} />
        </div>

        <div className="w-full bg-night rounded-full h-2.5 overflow-hidden">
          <div className="bg-mint h-full" style={{ width: `${(current.commentsUsed / current.commentsTotal) * 100}%` }} />
        </div>
        <p className="text-mist text-xs">{current.commentsUsed} of {current.commentsTotal} comments used</p>

        <div className="flex gap-3 flex-wrap pt-2">
          {higherPlans.length > 0 ? (
            <button onClick={() => setShowUpgrade(true)} className="btn-primary">Upgrade plan ($17)</button>
          ) : (
            <p className="text-mist text-sm">You're on our highest available plan.</p>
          )}
        </div>

        <p className="text-mist text-xs border-t border-white/10 pt-3">
          ⚠️ You can only upgrade to a higher plan for a flat $17 fee, charged instantly; your remaining comments carry over.
          Downgrades or lower-tier switches aren't available until your current subscription ends on {current.endDate}.
        </p>
      </div>

      {showUpgrade && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="card max-w-sm w-full space-y-4">
            <h3 className="font-display font-bold text-lg">Choose a higher plan</h3>
            {higherPlans.map((p) => (
              <button
                key={p.id}
                onClick={() => requestUpgrade(p)}
                className="w-full text-left border border-white/10 rounded-xl p-4 hover:border-mint transition"
              >
                <p className="font-bold">{p.name}</p>
                <p className="text-mist text-sm">{p.comments} comments / month — ${p.price}</p>
                <p className="text-mint text-xs mt-1">+ $17 instant upgrade fee</p>
              </button>
            ))}
            <button onClick={() => setShowUpgrade(false)} className="text-mist text-sm w-full text-center">Cancel</button>
          </div>
        </div>
      )}

      {msg && <div className="card text-mint text-sm">{msg}</div>}

      <div className="card space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h2 className="font-display text-xl font-bold">Comment quality breakdown</h2>
          <button onClick={exportMonthlyReport} className="btn-primary text-sm">Export monthly report (CSV)</button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(current.quality).map(([level, count]) => (
            <div key={level} className="text-center">
              <p className="stat-number">{count}</p>
              <p className="text-mist text-sm mt-1">from {level} tier</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <h2 className="font-display text-lg font-bold px-5 pt-5 pb-3">Admin reports on your tasks</h2>
        <p className="text-mist text-xs px-5 pb-3 -mt-2">
          Our team reviews every task and notifies you of the result. Execution details (links, screenshots) are kept internally as proof.
        </p>
        {taskLog.map((t, i) => (
          <div key={i} className="flex justify-between items-center px-5 py-4 border-t border-white/5 flex-wrap gap-2">
            <div>
              <p className="font-medium">{t.platform} — {t.commenter}</p>
              <p className="text-mist text-xs">Reviewed by react.tech team</p>
            </div>
            <div className="text-right">
              <Badge text={t.status === "approved" ? "Completed ✓" : "Not completed"} tone={t.status === "approved" ? "mint" : "danger"} />
              <p className="text-mist text-xs mt-1">{t.date}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
