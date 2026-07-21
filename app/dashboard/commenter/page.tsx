"use client";
import { useState } from "react";
import { Badge } from "@/lib/ui";

const packages = [
  { id: 1, name: "Starter", price: 19, commission: 0.20 },
  { id: 2, name: "Pro", price: 35, commission: 0.40 },
  { id: 3, name: "Elite", price: 69, commission: 0.60 },
];

const WITHDRAWAL_FEE = 6;
const MIN_WITHDRAWAL = 30;

// Sample data — replace with commenter_revenue_detail query in production
const current = {
  packageId: 2,
  walletBalance: 148,
  totalEarned: 640,
  reliability: 88,
  endDate: "2026-07-25",
};

const taskHistory = [
  { platform: "TikTok", status: "approved", earned: 0.40, date: "2026-07-03" },
  { platform: "Instagram", status: "pending", earned: 0, date: "2026-07-04" },
  { platform: "Twitter/X", status: "rejected", earned: 0, date: "2026-07-01" },
];

const activityFeed = [
  { note: "Commission on approved task", amount: 0.40, date: "2026-07-03 14:22" },
  { note: "Withdrawal request", amount: -148, date: "2026-06-28 10:00" },
  { note: "Referral bonus", amount: 5, date: "2026-06-20 16:40" },
  { note: "Pro plan renewal", amount: -30, date: "2026-06-01 09:00" },
];

const referral = { code: "SARAH2026", invited: 3, earned: 15 };

const statusText: Record<string, string> = { approved: "Approved", pending: "Under review", rejected: "Rejected" };
const statusTone: Record<string, "mint" | "sand" | "danger"> = { approved: "mint", pending: "sand", rejected: "danger" };

export default function CommenterDashboard() {
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [amount, setAmount] = useState(current.walletBalance);
  const [msg, setMsg] = useState<string | null>(null);

  const currentPkg = packages.find((p) => p.id === current.packageId)!;
  const higherPlans = packages.filter((p) => p.price > currentPkg.price);
  const netAmount = Math.max(0, amount - WITHDRAWAL_FEE);
  const canWithdraw = amount >= MIN_WITHDRAWAL && amount <= current.walletBalance;

  function confirmWithdraw() {
    // In production: await supabase.rpc('request_withdrawal', { p_commenter: userId, p_amount: amount, p_method: 'bank' })
    setMsg(`Withdrawal of $${amount} submitted — you'll receive a net $${netAmount.toFixed(2)} after the $${WITHDRAWAL_FEE} processing fee.`);
    setShowWithdraw(false);
  }

  function requestUpgrade(target: (typeof packages)[number]) {
    setMsg(`Your ${target.name} plan will activate instantly for a $17 upgrade fee.`);
    setShowUpgrade(false);
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      <h1 className="font-display text-3xl font-bold">Commenter Dashboard</h1>

      <div className="card space-y-4">
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div>
            <p className="text-mist text-sm">Wallet balance</p>
            <p className="stat-number">${current.walletBalance}</p>
          </div>
          <Badge text={`Reliability ${current.reliability}%`} tone={current.reliability < 70 ? "danger" : "mint"} />
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => setShowWithdraw(true)} className="btn-primary">Withdraw earnings</button>
          <p className="text-mist text-xs self-center">Minimum ${MIN_WITHDRAWAL} — flat ${WITHDRAWAL_FEE} processing fee per payout</p>
        </div>
      </div>

      <div className="card space-y-3">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div>
            <p className="text-mist text-sm">Current plan</p>
            <h2 className="font-display text-xl font-bold text-sand">{currentPkg.name}</h2>
            <p className="text-mist text-sm">${currentPkg.commission.toFixed(2)} per approved comment</p>
          </div>
          {higherPlans.length > 0 && (
            <button onClick={() => setShowUpgrade(true)} className="btn-primary text-sm">Upgrade ($17)</button>
          )}
        </div>
        <p className="text-mist text-xs border-t border-white/10 pt-3">
          ⚠️ Upgrading to a higher plan activates instantly for a flat $17 fee. Downgrades aren't available until your current subscription ends on {current.endDate}.
        </p>
      </div>

      {showWithdraw && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="card max-w-sm w-full space-y-4">
            <h3 className="font-display font-bold text-lg">Withdraw earnings</h3>
            <div>
              <label className="text-mist text-sm">Amount (minimum ${MIN_WITHDRAWAL})</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                max={current.walletBalance}
                min={MIN_WITHDRAWAL}
                className="w-full mt-1 bg-night border border-white/10 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div className="bg-night rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-mist">Requested amount</span><span>${amount}</span></div>
              <div className="flex justify-between"><span className="text-mist">Processing fee</span><span className="text-danger">− ${WITHDRAWAL_FEE}</span></div>
              <div className="flex justify-between font-bold pt-1 border-t border-white/10"><span>Net transfer</span><span className="text-mint">${netAmount.toFixed(2)}</span></div>
            </div>
            {!canWithdraw && <p className="text-danger text-xs">Check the minimum (${MIN_WITHDRAWAL}) and your available balance.</p>}
            <div className="flex gap-2">
              <button disabled={!canWithdraw} onClick={confirmWithdraw} className="btn-primary flex-1 disabled:opacity-40">Confirm withdrawal</button>
              <button onClick={() => setShowWithdraw(false)} className="text-mist text-sm px-4">Cancel</button>
            </div>
          </div>
        </div>
      )}

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
                <p className="text-mist text-sm">${p.commission.toFixed(2)} per comment — ${p.price}/mo subscription</p>
                <p className="text-mint text-xs mt-1">+ $17 instant upgrade fee</p>
              </button>
            ))}
            <button onClick={() => setShowUpgrade(false)} className="text-mist text-sm w-full text-center">Cancel</button>
          </div>
        </div>
      )}

      {msg && <div className="card text-mint text-sm">{msg}</div>}

      <div className="card space-y-3">
        <h2 className="font-display text-lg font-bold">Invite commenters, earn 🎁</h2>
        <p className="text-mist text-sm">Share your code — earn $5 after each referral completes their first approved task.</p>
        <div className="flex items-center gap-2 flex-wrap">
          <code className="bg-night px-3 py-2 rounded-lg text-mint font-mono text-sm">{referral.code}</code>
          <Badge text={`${referral.invited} invited`} tone="mint" />
          <Badge text={`$${referral.earned} earned`} tone="sand" />
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <h2 className="font-display text-lg font-bold px-5 pt-5 pb-3">Activity log</h2>
        {activityFeed.map((a, i) => (
          <div key={i} className="flex justify-between items-center px-5 py-3 border-t border-white/5">
            <p className="text-sm">{a.note}</p>
            <div className="text-right">
              <p className={`text-sm font-bold ${a.amount > 0 ? "text-mint" : "text-danger"}`}>
                {a.amount > 0 ? "+" : ""}${a.amount}
              </p>
              <p className="text-mist text-xs">{a.date}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        <h2 className="font-display text-lg font-bold px-5 pt-5 pb-3">Your task history</h2>
        {taskHistory.map((t, i) => (
          <div key={i} className="flex justify-between items-center px-5 py-4 border-t border-white/5 flex-wrap gap-2">
            <p className="font-medium">{t.platform}</p>
            <div className="text-right">
              <Badge text={statusText[t.status]} tone={statusTone[t.status]} />
              <p className="text-mist text-xs mt-1">{t.date}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
