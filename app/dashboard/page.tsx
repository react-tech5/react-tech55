export default function Dashboard() {
  const stats = [
    { label: "Active clients", value: "—" },
    { label: "Active commenters", value: "—" },
    { label: "Tasks this month", value: "—" },
    { label: "Net revenue ($)", value: "—" },
  ];

  return (
    <main className="max-w-5xl mx-auto px-6 py-12 space-y-8">
      <h1 className="font-display text-3xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <p className="stat-number">{s.value}</p>
            <p className="text-mist text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="card">
        <p className="text-mist">
          Connect your environment variables in Vercel, then run supabase/schema.sql
          to power this dashboard with real data.
        </p>
      </div>
    </main>
  );
}
