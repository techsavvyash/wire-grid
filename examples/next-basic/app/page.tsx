const stats = [
  ["Adapter", "Next.js"],
  ["Runtime", "Enabled"],
  ["Editing", "Planned"],
]

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">Wire Grid fixture</p>
        <h1>Hello, from other side.</h1>
        <p className="lede">
          This app exists to test the Next.js adapter, runtime overlay, and
          future source editing flow against a real development server.
        </p>
      </section>
      <section className="stats" aria-label="Fixture status">
        {stats.map(([label, value]) => (
          <article key={label} className="stat-card">
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>
    </main>
  )
}
