import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Laptick — How We Work',
  description:
    'Laptick recommends laptops for Indian buyers by analysing real hardware specs — not marketing copy. Free, no signup, no ads.',
}

const STEPS = [
  {
    step: '01',
    title: 'You answer 5 quick questions',
    desc: "Your role, main use, budget, what matters most, and OS preference. That's it — no signup, no email, no personal data needed.",
  },
  {
    step: '02',
    title: 'AI analyses the specs — not the marketing',
    desc: "Claude (Anthropic's AI model) looks at real specs: GPU TGP wattage, CPU series (H vs U), RAM type, display nits and color accuracy. It compares these against what YOUR specific use case actually needs.",
  },
  {
    step: '03',
    title: 'You get top 3 with explanations that mean something',
    desc: 'Not "powerful processor" — but "this i7-13700H has 6 performance cores that handle your game at full speed while 8 efficiency cores keep Discord and Chrome running without stealing FPS."',
  },
  {
    step: '04',
    title: 'We include an honest weakness for every pick',
    desc: "Every laptop has a trade-off. We tell you what it is — even for our #1 pick. Fan noise at 42dB, soldered RAM that can't be upgraded, 60Hz display when 120Hz is available nearby.",
  },
  {
    step: '05',
    title: 'Database updated every week',
    desc: 'Every Monday, an automated agent checks for new releases, price drops, and discontinued models across Amazon and Flipkart India.',
  },
]

const STATS = [
  { number: '33', label: 'Curated laptops', sub: 'Manually verified specs' },
  { number: '8', label: 'Top brands', sub: 'Acer, ASUS, Apple, Dell, HP, Lenovo, MSI, Alienware' },
  { number: '₹35k–₹4L', label: 'Price range', sub: 'Every Indian budget segment' },
]

const AUDIENCES = [
  { who: 'First-time laptop buyer', why: 'Doesn\'t know what "H-series" or "TGP" means — just wants the right laptop' },
  { who: 'College student', why: 'Needs to balance battery life, weight, budget, and enough power for coursework' },
  { who: 'Developer switching setups', why: 'Knows they need fast compilation but doesn\'t know which laptop spec to prioritise' },
  { who: 'Parent buying for child', why: 'Wants an honest answer without getting sold up to something unnecessary' },
  { who: 'Content creator', why: 'Needs GPU + display quality but confused by which GPU is actually fast' },
  { who: 'Business professional', why: 'Needs something reliable, portable, and sharp — not gaming specs they\'ll never use' },
]

export default function AboutPage() {
  return (
    <div className="laptick-themed-page">
      <article className="mx-auto max-w-4xl space-y-16 px-4 pb-16 pt-8 sm:px-6">

        {/* Hero */}
        <div style={{ paddingBlock: 'clamp(1.5rem, 5vw, 4rem)' }}>
          <p className="themed-eyebrow">About Laptick</p>
          <h1 className="themed-heading mt-4">
            We explain laptops the way a knowledgeable friend would.
          </h1>
          <p className="themed-subtext mt-6" style={{ maxWidth: 720 }}>
            Not specs sheets. Not marketing buzzwords. Just honest, plain-English answers
            to &ldquo;which laptop is actually right for me?&rdquo;
          </p>
        </div>

        {/* Why We Built This */}
        <section className="space-y-5">
          <h2 className="themed-section-heading">Why We Built This</h2>
          <div className="themed-body-text space-y-4">
            <p>
              Walk into any laptop store in India and a salesperson will say{' '}
              <em>&ldquo;this one has a very powerful processor, sir.&rdquo;</em> Open Amazon and
              you&rsquo;ll see a table of specs with no explanation of what any of them mean.
            </p>
            <p>
              Meanwhile, the buyer — a student buying their first laptop, a developer
              switching from desktop, a small business owner setting up their team — just wants
              to know one thing:{' '}
              <strong style={{ color: 'hsl(0 0% 2%)' }}>
                will this laptop actually do what I need it to do?
              </strong>
            </p>
            <p>
              That&rsquo;s the gap Laptick fills. We take 5 simple answers about you and your
              work, match them against real hardware specs, and explain — in plain English —
              exactly why a laptop is or isn&rsquo;t right for you.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="space-y-8">
          <h2 className="themed-section-heading">How Recommendations Work</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map(({ step, title, desc }) => (
              <div key={step} className="themed-card">
                <span className="themed-card-label">Step {step}</span>
                <strong className="themed-card-title">{title}</strong>
                <p className="themed-card-body">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Our database */}
        <section className="space-y-6">
          <h2 className="themed-section-heading">Our Laptop Database</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {STATS.map(({ number, label, sub }) => (
              <div key={label} className="themed-card" style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '2rem', fontWeight: 950, color: '#00d5ff' }}>{number}</p>
                <p style={{ fontWeight: 800, fontSize: '0.9rem' }}>{label}</p>
                <p className="themed-card-body">{sub}</p>
              </div>
            ))}
          </div>
          <p className="themed-body-text">
            Every laptop in our database has its full specs manually verified — CPU model,
            GPU TGP wattage, display color gamut, battery capacity, and weight. We don&rsquo;t
            trust the marketing spec sheet; we cross-reference against benchmarks and teardowns.
          </p>
        </section>

        {/* Affiliate */}
        <section className="space-y-5">
          <h2 className="themed-section-heading">How We Make Money</h2>
          <div className="themed-card space-y-4">
            <div className="space-y-2">
              <p style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                💰 Amazon &amp; Flipkart affiliate commissions
              </p>
              <p className="themed-card-body">
                When you click &ldquo;Buy on Amazon&rdquo; or &ldquo;Buy on Flipkart&rdquo; and
                complete a purchase, we earn a small commission — typically 1-4% — at absolutely
                no extra cost to you. The price you see is the same price you pay.
              </p>
            </div>
            <div style={{ borderTop: '1px solid hsl(0 0% 85%)', paddingTop: '1rem' }}>
              <p style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                Why this doesn&rsquo;t affect our rankings:
              </p>
              <ul className="space-y-2">
                {[
                  'Our rankings are generated by AI based purely on spec analysis against your stated needs',
                  'We earn the same commission rate regardless of which laptop you buy',
                  "We include an honest weakness for every recommendation — including the #1 pick",
                  "We show laptops from both Amazon and Flipkart — we don't push one platform",
                ].map((item) => (
                  <li key={item} className="themed-card-body flex items-start gap-2">
                    <span className="mt-0.5 flex-shrink-0" style={{ color: '#22c55e' }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Who is this for */}
        <section className="space-y-6">
          <h2 className="themed-section-heading">Who Laptick Is For</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {AUDIENCES.map(({ who, why }) => (
              <div key={who} className="themed-card">
                <strong className="themed-card-title">{who}</strong>
                <p className="themed-card-body">{why}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="themed-card" style={{ textAlign: 'center', background: '#d9ff3f' }}>
          <p style={{ fontWeight: 950, fontSize: '1.3rem' }}>Ready? It takes 30 seconds.</p>
          <p className="themed-card-body">
            No signup. No email. No ads. Just your top 3 laptops with honest explanations.
          </p>
          <Link href="/find-my-laptop" className="themed-primary-action mt-3" style={{ background: 'hsl(0 0% 2%)', color: '#d9ff3f' }}>
            Find My Laptop <ArrowRight className="inline h-4 w-4" />
          </Link>
        </div>

      </article>
    </div>
  )
}
