export function Badge({ text, tone = "mist" }: { text: string; tone?: "mint" | "sand" | "danger" | "mist" }) {
  const colors: Record<string, string> = {
    mint: "bg-mint/15 text-mint",
    sand: "bg-sand/15 text-sand",
    danger: "bg-danger/15 text-danger",
    mist: "bg-mist/15 text-mist",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colors[tone]}`}>
      {text}
    </span>
  );
}

export function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="card p-0 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-mist">
            {headers.map((h) => (
              <th key={h} className="text-left px-4 py-3 font-medium whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
