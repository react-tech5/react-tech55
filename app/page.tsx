const companyPlans = [
  { name: "Starter", price: 149, comments: 100 },
  { name: "Growth", price: 370, comments: 300 },
  { name: "Pro", price: 730, comments: 600 },
];

const commenterPlans = [
  { name: "Starter", price: 19, commission: 0.20 },
  { name: "Pro", price: 35, commission: 0.40 },
  { name: "Elite", price: 69, commission: 0.60 },
];

export default function Home() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-16 space-y-20">
      {/* Hero */}
      <section className="text-center space-y-6">
        <p className="text-mint font-display tracking-widest text-sm">real engagement · real people</p>
        <h1 className="font-display text-5xl font-bold leading-tight">
          <span className="text-mint">Real</span> comments for your brand
        </h1>
        <p className="text-mist max-w-xl mx-auto">
          react.tech connects clients with real commenters on TikTok, Instagram and Twitter/X,
          with verified proof on every single comment and a strict reliability system.
        </p>
        <div className="flex gap-4 justify-center">
          <a href="/signup?role=company" className="btn-primary">Start as a client</a>
          <a href="/signup?role=commenter" className="px-6 py-3 rounded-xl border border-mint/40 text-mint font-display">
            Earn as a commenter
          </a>
        </div>
        <p className="text-mist text-sm">
          Already have an account? <a href="/login" className="text-mint underline">Sign in</a>
        </p>
      </section>

      {/* Client plans */}
      <section className="space-y-6">
        <h2 className="font-display text-2xl font-bold">Client plans</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {companyPlans.map((p) => (
            <div key={p.name} className="card space-y-3">
              <h3 className="font-display font-bold text-lg">{p.name}</h3>
              <p className="stat-number">${p.price} <span className="text-base text-mist">/mo</span></p>
              <p className="text-mist">{p.comments} real comments</p>
              <p className="text-mist text-xs">+ fast delivery $0.50 · custom keywords $0.30 (optional)</p>
              <a href="/signup?role=company" className="btn-primary w-full block text-center">Subscribe now</a>
            </div>
          ))}
        </div>
      </section>

      {/* Commenter plans */}
      <section className="space-y-6">
        <h2 className="font-display text-2xl font-bold">Commenter plans</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {commenterPlans.map((p) => (
            <div key={p.name} className="card space-y-3">
              <h3 className="font-display font-bold text-lg">{p.name}</h3>
              <p className="stat-number">${p.price} <span className="text-base text-mist">/mo</span></p>
              <p className="text-mint">${p.commission.toFixed(2)} per approved comment</p>
              <p className="text-mist text-xs">$6 flat withdrawal fee per payout</p>
              <a href="/signup?role=commenter" className="btn-primary w-full block text-center">Join now</a>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-8 border-t border-white/10 flex flex-col items-center gap-3 text-center">
        <p className="text-mist text-sm">
          Need help? Contact us at{" "}
          <a href="mailto:React.Tech5@Gmail.com" className="text-mint underline">
            React.Tech5@Gmail.com
          </a>
        </p>
        <p className="text-mist/40 text-xs">
          © {new Date().getFullYear()} react.tech · <a href="/owner-access" className="hover:text-mist">·</a>
        </p>
      </footer>
    </main>
  );
}
