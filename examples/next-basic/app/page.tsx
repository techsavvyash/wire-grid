import type { HTMLAttributes, ReactNode } from "react"

const stats = [
  ["Adapter", "Next.js"],
  ["Runtime", "Enabled"],
  ["Editing", "Planned"],
]

function FeatureCard({
  children,
  ...props
}: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <article className="feature-card" {...props}>
      {children}
    </article>
  )
}

function Callout({
  heading,
  ...props
}: HTMLAttributes<HTMLElement> & { heading: string }) {
  return (
    <article className="callout" {...props}>
      <strong>{heading}</strong>
    </article>
  )
}

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">Wire Grid fixture</p>
        <h1 style={{ color: "#111827" }}>Hello, from other side.</h1>
        <p className="lede">
          This app exists to test the Next.js adapter, runtime overlay, and
          future source editing flow against a real development server.
        </p>
      </section>
      <section className="component-fixture" aria-label="Component fixture">
        <FeatureCard>Component text child.</FeatureCard>
        <Callout heading="Prop text heading." />
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
