"use client";
import { useState, useEffect, useMemo } from "react";
import { Badge, Table } from "@/lib/ui";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

type Tab = "clients" | "commenters" | "withdrawals" | "proofs" | "disputes" | "analytics";

const statusText: Record<string, string> = {
  active: "نشط", expired: "منتهي", suspended: "موقوف",
  pending: "قيد الانتظار", paid: "تم التحويل", approved: "مقبول", rejected: "مرفوض",
  completed: "مكتمل",
};
const statusTone: Record<string, "mint" | "sand" | "danger" | "mist"> = {
  active: "mint", expired: "mist", suspended: "danger",
  pending: "sand", paid: "mint", approved: "mint", rejected: "danger", completed: "mint",
};

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("ar-SA", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

async function fetchJson(url: string) {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "فشل تحميل البيانات");
  return json;
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("clients");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [clients, setClients] = useState<any[]>([]);
  const [commenters, setCommenters] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [profit, setProfit] = useState<any>(null);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [proofs, setProofs] = useState<any[]>([]);

  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedCommenter, setSelectedCommenter] = useState<string | null>(null);
  const [clientDetail, setClientDetail] = useState<any>(null);
  const [commenterDetail, setCommenterDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      setError(null);
      try {
        const [c, m, w, p, d, pr] = await Promise.all([
          fetchJson("/api/admin/clients"),
          fetchJson("/api/admin/commenters"),
          fetchJson("/api/admin/withdrawals"),
          fetchJson("/api/admin/profit"),
          fetchJson("/api/admin/disputes"),
          fetchJson("/api/admin/proofs"),
        ]);
        setClients(c.data || []);
        setCommenters(m.data || []);
        setWithdrawals(w.data || []);
        setProfit(p.data);
        setDisputes(d.data || []);
        setProofs(pr.data || []);
      } catch (err: any) {
        setError(err.message || "حدث خطأ أثناء تحميل البيانات");
      }
      setLoading(false);
    }
    loadAll();
  }, []);

  useEffect(() => {
    if (!selectedClient) return;
    setDetailLoading(true);
    fetchJson(`/api/admin/clients/${selectedClient}`)
      .then((res) => setClientDetail(res))
      .catch((err) => setClientDetail({ error: err.message }))
      .finally(() => setDetailLoading(false));
  }, [selectedClient]);

  useEffect(() => {
    if (!selectedCommenter) return;
    setDetailLoading(true);
    fetchJson(`/api/admin/commenters/${selectedCommenter}`)
      .then((res) => setCommenterDetail(res))
      .catch((err) => setCommenterDetail({ error: err.message }))
      .finally(() => setDetailLoading(false));
  }, [selectedCommenter]);

  const filteredClients = useMemo(
    () => clients.filter((c) => (c.company_name || "").toLowerCase().includes(search.toLowerCase())),
    [clients, search]
  );
  const filteredCommenters = useMemo(
    () => commenters.filter((m) => (m.commenter_name || "").toLowerCase().includes(search.toLowerCase())),
    [commenters, search]
  );

  return (
    <main dir="rtl" className="max-w-6xl mx-auto px-6 py-10 space-y-8 font-sans">
      <div>
        <h1 className="text-3xl font-bold">لوحة إدارة المنصة</h1>
        <p className="text-mist mt-1">بيانات حقيقية ومباشرة من قاعدة البيانات — حصرية لك فقط</p>
      </div>

      {error && (
        <div className="card bg-danger/10 border-danger/30 text-danger text-sm">
          تعذّر تحميل بعض البيانات: {error}
        </div>
      )}

      {/* إحصائيات علوية */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card"><p className="stat-number">{loading ? "…" : clients.length}</p><p className="text-mist text-sm mt-1">العملاء</p></div>
        <div className="card"><p className="stat-number">{loading ? "…" : commenters.length}</p><p className="text-mist text-sm mt-1">المعلقون</p></div>
        <div className="card"><p className="stat-number">{loading ? "…" : withdrawals.filter((w) => w.status === "pending").length}</p><p className="text-mist text-sm mt-1">سحوبات قيد الانتظار</p></div>
        <div className="card"><p className="stat-number">{loading || !profit ? "…" : `$${Number(profit.net_profit || 0).toLocaleString()}`}</p><p className="text-mist text-sm mt-1">الربح الصافي هذا الشهر</p></div>
      </div>

      {/* تبويبات */}
      <div className="flex gap-2 flex-wrap border-b border-white/10 pb-1">
        {[
          { key: "clients", label: "العملاء" },
          { key: "commenters", label: "المعلقون" },
          { key: "withdrawals", label: "كشف التحويلات" },
          { key: "proofs", label: "إثبات المهام" },
          { key: "disputes", label: `النزاعات المفتوحة (${disputes.length})` },
          { key: "analytics", label: "التحليلات" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as Tab)}
            className={`px-4 py-2 rounded-t-lg text-sm font-semibold whitespace-nowrap ${
              tab === t.key ? "bg-petrol text-mint" : "text-mist hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {(tab === "clients" || tab === "commenters") && (
        <input
          type="text"
          placeholder="ابحث بالاسم..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-72 bg-petrol border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder:text-mist"
        />
      )}

      {loading && <p className="text-mist text-sm">جارٍ تحميل البيانات...</p>}

      {/* العملاء */}
      {!loading && tab === "clients" && (
        <>
          <Table headers={["العميل", "الباقة", "الحالة", "تعليقات متبقية", "ينتهي في", "مهام منشأة", "مهام مكتملة", ""]}>
            {filteredClients.map((c) => (
              <tr key={c.company_id} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3 font-medium">{c.company_name}</td>
                <td className="px-4 py-3 text-sand">{c.package_name}</td>
                <td className="px-4 py-3"><Badge text={statusText[c.status] || c.status} tone={statusTone[c.status] || "mist"} /></td>
                <td className="px-4 py-3">{c.comments_remaining}</td>
                <td className="px-4 py-3 text-mist text-xs">{fmtDate(c.end_date)}</td>
                <td className="px-4 py-3">{c.tasks_created}</td>
                <td className="px-4 py-3 text-mint">{c.tasks_completed}</td>
                <td className="px-4 py-3">
                  <button onClick={() => setSelectedClient(c.company_id)} className="text-mint underline text-xs">التفاصيل</button>
                </td>
              </tr>
            ))}
            {filteredClients.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-mist text-sm">لا يوجد عملاء مسجّلون بعد</td></tr>
            )}
          </Table>
        </>
      )}

      {/* المعلقون */}
      {!loading && tab === "commenters" && (
        <Table headers={["المعلّق", "الباقة", "الحالة", "الرصيد", "إجمالي الأرباح", "الموثوقية", "مهام منجزة", ""]}>
          {filteredCommenters.map((m) => (
            <tr key={m.commenter_id} className="border-b border-white/5 last:border-0">
              <td className="px-4 py-3 font-medium">{m.commenter_name}</td>
              <td className="px-4 py-3 text-sand">{m.package_name}</td>
              <td className="px-4 py-3"><Badge text={statusText[m.status] || m.status} tone={statusTone[m.status] || "mist"} /></td>
              <td className="px-4 py-3">${m.wallet_balance}</td>
              <td className="px-4 py-3">${m.total_earned}</td>
              <td className="px-4 py-3"><span className={m.reliability_score < 70 ? "text-danger" : "text-mint"}>{m.reliability_score}%</span></td>
              <td className="px-4 py-3">{m.tasks_completed}</td>
              <td className="px-4 py-3">
                <button onClick={() => setSelectedCommenter(m.commenter_id)} className="text-mint underline text-xs">التفاصيل</button>
              </td>
            </tr>
          ))}
          {filteredCommenters.length === 0 && (
            <tr><td colSpan={8} className="px-4 py-6 text-center text-mist text-sm">لا يوجد معلّقون مسجّلون بعد</td></tr>
          )}
        </Table>
      )}

      {/* كشف التحويلات */}
      {!loading && tab === "withdrawals" && (
        <Table headers={["المعلّق", "المبلغ المطلوب", "الرسوم", "الصافي المحوّل", "الطريقة", "الحالة", "تاريخ الطلب"]}>
          {withdrawals.map((w) => (
            <tr key={w.withdrawal_id} className="border-b border-white/5 last:border-0">
              <td className="px-4 py-3 font-medium">{w.commenter_name}</td>
              <td className="px-4 py-3">${w.amount_requested}</td>
              <td className="px-4 py-3 text-danger">− ${w.fee_deducted}</td>
              <td className="px-4 py-3 text-mint font-bold">${w.net_transferred}</td>
              <td className="px-4 py-3 text-mist">{w.transfer_method || "—"}</td>
              <td className="px-4 py-3"><Badge text={statusText[w.status] || w.status} tone={statusTone[w.status] || "mist"} /></td>
              <td className="px-4 py-3 text-mist text-xs">{fmtDate(w.requested_at)}</td>
            </tr>
          ))}
          {withdrawals.length === 0 && (
            <tr><td colSpan={7} className="px-4 py-6 text-center text-mist text-sm">لا توجد طلبات سحب بعد</td></tr>
          )}
        </Table>
      )}

      {/* إثبات المهام */}
      {!loading && tab === "proofs" && (
        <div className="space-y-4">
          <div className="card bg-mint/5 border-mint/20">
            <p className="text-mint text-sm font-semibold">🔒 هذا القسم حصري لك فقط</p>
            <p className="text-mist text-xs mt-1">العملاء لا يصلون لهذه الروابط والصور مباشرة إطلاقاً — مطبّق عبر صلاحيات قاعدة البيانات.</p>
          </div>
          <Table headers={["المعلّق", "المنصة", "العميل", "رابط التعليق", "الحالة", "الوقت"]}>
            {proofs.map((p, i) => (
              <tr key={i} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3 font-medium">{p.commenter_name}</td>
                <td className="px-4 py-3">{p.platform}</td>
                <td className="px-4 py-3 text-mist">{p.company_name}</td>
                <td className="px-4 py-3 text-mint underline text-xs" dir="ltr">{p.comment_url}</td>
                <td className="px-4 py-3"><Badge text={statusText[p.review_status] || p.review_status} tone={statusTone[p.review_status] || "mist"} /></td>
                <td className="px-4 py-3 text-mist text-xs">{fmtDate(p.submitted_at)}</td>
              </tr>
            ))}
            {proofs.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-mist text-sm">لا توجد إثباتات بعد</td></tr>
            )}
          </Table>
        </div>
      )}

      {/* النزاعات */}
      {!loading && tab === "disputes" && (
        <div className="space-y-4">
          {disputes.length === 0 && <p className="text-mist text-sm">لا توجد نزاعات مفتوحة حالياً 🎉</p>}
          {disputes.map((d) => (
            <div key={d.id} className="card space-y-2">
              <p className="font-bold">{d.reason}</p>
              <p className="text-mist text-xs">{d.tasks?.platform} — {fmtDate(d.created_at)}</p>
            </div>
          ))}
        </div>
      )}

      {/* التحليلات */}
      {!loading && tab === "analytics" && profit && (
        <div className="card space-y-4">
          <h3 className="font-bold">تفصيل الربح الصافي لهذا الشهر</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div><p className="stat-number">${profit.subscriptions || 0}</p><p className="text-mist text-xs mt-1">الاشتراكات</p></div>
            <div><p className="stat-number">${profit.platform_share_from_comments || 0}</p><p className="text-mist text-xs mt-1">حصة التعليقات</p></div>
            <div><p className="stat-number">${profit.service_fees || 0}</p><p className="text-mist text-xs mt-1">رسوم الخدمات</p></div>
            <div><p className="stat-number">${profit.upgrade_fees || 0}</p><p className="text-mist text-xs mt-1">رسوم الترقيات</p></div>
          </div>
        </div>
      )}

      {/* نافذة تفاصيل العميل */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => { setSelectedClient(null); setClientDetail(null); }}>
          <div className="card max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">{clientDetail?.profile?.full_name || "تفاصيل العميل"}</h3>
              <button onClick={() => { setSelectedClient(null); setClientDetail(null); }} className="text-mist">✕</button>
            </div>
            {detailLoading && <p className="text-mist text-sm">جارٍ التحميل...</p>}
            {clientDetail?.error && <p className="text-danger text-sm">{clientDetail.error}</p>}
            {clientDetail && !clientDetail.error && (
              <>
                <div className="bg-night rounded-lg p-3 text-sm space-y-1">
                  <p className="text-mist">تاريخ التسجيل: {fmtDate(clientDetail.profile?.created_at)}</p>
                  <p className="text-mist">الباقة: {clientDetail.subscription?.company_packages?.name || "—"}</p>
                  <p className="text-mist">ينتهي في: {fmtDate(clientDetail.subscription?.end_date)}</p>
                  <p className="text-mist">رصيد النقاط: {clientDetail.subscription?.points_balance ?? "—"}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">سجل المهام ({clientDetail.tasks?.length || 0})</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {clientDetail.tasks?.map((t: any) => (
                      <div key={t.id} className="flex justify-between text-xs border-b border-white/5 pb-2">
                        <span>{t.platform}</span>
                        <Badge text={statusText[t.status] || t.status} tone={statusTone[t.status] || "mist"} />
                        <span className="text-mist">{fmtDate(t.created_at)}</span>
                      </div>
                    ))}
                    {(!clientDetail.tasks || clientDetail.tasks.length === 0) && <p className="text-mist text-xs">لا توجد مهام بعد</p>}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">سجل المعاملات المالية ({clientDetail.transactions?.length || 0})</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {clientDetail.transactions?.map((tx: any) => (
                      <div key={tx.id} className="flex justify-between text-xs border-b border-white/5 pb-2">
                        <span>{tx.note || tx.type}</span>
                        <span className={Number(tx.amount) < 0 ? "text-danger" : "text-mint"}>${tx.amount}</span>
                        <span className="text-mist">{fmtDate(tx.created_at)}</span>
                      </div>
                    ))}
                    {(!clientDetail.transactions || clientDetail.transactions.length === 0) && <p className="text-mist text-xs">لا توجد معاملات بعد</p>}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* نافذة تفاصيل المعلق */}
      {selectedCommenter && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => { setSelectedCommenter(null); setCommenterDetail(null); }}>
          <div className="card max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">{commenterDetail?.profile?.full_name || "تفاصيل المعلّق"}</h3>
              <button onClick={() => { setSelectedCommenter(null); setCommenterDetail(null); }} className="text-mist">✕</button>
            </div>
            {detailLoading && <p className="text-mist text-sm">جارٍ التحميل...</p>}
            {commenterDetail?.error && <p className="text-danger text-sm">{commenterDetail.error}</p>}
            {commenterDetail && !commenterDetail.error && (
              <>
                <div className="bg-night rounded-lg p-3 text-sm space-y-1">
                  <p className="text-mist">تاريخ التسجيل: {fmtDate(commenterDetail.profile?.created_at)}</p>
                  <p className="text-mist">الباقة: {commenterDetail.subscription?.commenter_packages?.name || "—"}</p>
                  <p className="text-mist">ينتهي في: {fmtDate(commenterDetail.subscription?.end_date)}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">سجل المهام والإثبات ({commenterDetail.submissions?.length || 0})</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {commenterDetail.submissions?.map((s: any) => (
                      <div key={s.id} className="flex justify-between text-xs border-b border-white/5 pb-2">
                        <span>{s.tasks?.platform}</span>
                        <Badge text={statusText[s.review_status] || s.review_status} tone={statusTone[s.review_status] || "mist"} />
                        <span className="text-mist">{fmtDate(s.submitted_at)}</span>
                      </div>
                    ))}
                    {(!commenterDetail.submissions || commenterDetail.submissions.length === 0) && <p className="text-mist text-xs">لا توجد مهام بعد</p>}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">سجل السحوبات ({commenterDetail.withdrawals?.length || 0})</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {commenterDetail.withdrawals?.map((w: any) => (
                      <div key={w.id} className="flex justify-between text-xs border-b border-white/5 pb-2">
                        <span>${w.amount}</span>
                        <Badge text={statusText[w.status] || w.status} tone={statusTone[w.status] || "mist"} />
                        <span className="text-mist">{fmtDate(w.requested_at)}</span>
                      </div>
                    ))}
                    {(!commenterDetail.withdrawals || commenterDetail.withdrawals.length === 0) && <p className="text-mist text-xs">لا توجد سحوبات بعد</p>}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">سجل المعاملات المالية ({commenterDetail.transactions?.length || 0})</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {commenterDetail.transactions?.map((tx: any) => (
                      <div key={tx.id} className="flex justify-between text-xs border-b border-white/5 pb-2">
                        <span>{tx.note || tx.type}</span>
                        <span className={Number(tx.amount) < 0 ? "text-danger" : "text-mint"}>${tx.amount}</span>
                        <span className="text-mist">{fmtDate(tx.created_at)}</span>
                      </div>
                    ))}
                    {(!commenterDetail.transactions || commenterDetail.transactions.length === 0) && <p className="text-mist text-xs">لا توجد معاملات بعد</p>}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
