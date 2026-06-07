import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, AlertCircle, RefreshCw, Search, Cpu, IndianRupee } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Laptick — How We Work',
  description:
    'Laptick recommends laptops for Indian buyers by analysing real hardware specs — not marketing copy. Free, no signup, no ads.',
}

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 space-y-14">

      {/* Hero */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold leading-tight">
          We explain laptops the way a knowledgeable friend would
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Not specs sheets. Not marketing buzzwords. Just honest, plain-English answers
          to "which laptop is actually right for me?"
        </p>
      </div>

      {/* The Problem */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold">Why We Built This</h2>
        <div className="space-y-4 text-muted-foreground leading-relaxed">
          <p>
            Walk into any laptop store in India and a salesperson will say{' '}
            <em>"this one has a very powerful processor, sir."</em> Open Amazon and you'll see
            a table of specs with no explanation of what any of them mean.
          </p>
          <p>
            Meanwhile, the buyer — a student buying their first laptop, a developer
            switching from desktop, a small business owner setting up their team — just wants
            to know one thing: <strong className="text-foreground">will this laptop actually do what I need it to do?</strong>
          </p>
          <p>
            That's the gap Laptick fills. We take 5 simple answers about you and your
            work, match them against real hardware specs, and explain — in plain English —
            exactly why a laptop is or isn't right for you.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">How Recommendations Work</h2>
        <div className="space-y-4">
          {[
            {
              icon: Search,
              step: '1',
              title: 'You answer 5 quick questions',
              desc: 'Your role, main use, budget, what matters most, and OS preference. That\'s it — no signup, no email, no personal data needed.',
            },
            {
              icon: Cpu,
              step: '2',
              title: 'AI analyses the specs — not the marketing',
              desc: 'Claude (Anthropic\'s AI model) looks at real specs: GPU TGP wattage, CPU series (H vs U), RAM type, display nits and color accuracy. It compares these against what YOUR specific use case actually needs.',
            },
            {
              icon: CheckCircle2,
              step: '3',
              title: 'You get top 3 with explanations that mean something',
              desc: 'Not "powerful processor" — but "this i7-13700H has 6 performance cores that handle your game at full speed while 8 efficiency cores keep Discord and Chrome running without stealing FPS." We explain what every spec means for your life.',
            },
            {
              icon: AlertCircle,
              step: '4',
              title: 'We include an honest weakness for every pick',
              desc: 'Every laptop has a trade-off. We tell you what it is — even for our #1 pick. Fan noise at 42dB, soldered RAM that can\'t be upgraded, 60Hz display when 120Hz is available nearby. You deserve the full picture.',
            },
            {
              icon: RefreshCw,
              step: '5',
              title: 'Database updated every week',
              desc: 'Every Monday, an automated agent checks for new releases, price drops, and discontinued models across Amazon and Flipkart India. Prices shown reflect the most recent Monday update.',
            },
          ].map(({ icon: Icon, step, title, desc }) => (
            <div key={step} className="flex gap-4">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                <Icon className="h-4 w-4 text-accent" />
              </div>
              <div className="space-y-1 pb-4 border-b border-border/30 last:border-0 flex-1">
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Our database */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Our Laptop Database</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { number: '33', label: 'Curated laptops', sub: 'Updated from your CSV' },
            { number: '8', label: 'Top brands', sub: 'Acer, ASUS, Apple, Dell, HP, Lenovo, MSI, Alienware' },
            { number: '₹35k–₹4L', label: 'Price range', sub: 'Every Indian budget segment' },
          ].map(({ number, label, sub }) => (
            <div key={label} className="rounded-xl border border-border/50 bg-card/30 p-5 text-center space-y-1">
              <p className="text-2xl font-bold text-accent">{number}</p>
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Every laptop in our database has its full specs manually verified — CPU model, GPU TGP wattage,
          display color gamut, battery capacity, and weight. We don't trust the marketing spec sheet;
          we cross-reference against benchmarks and teardowns.
        </p>
      </section>

      {/* Affiliate */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">How We Make Money</h2>
        <div className="rounded-xl border border-border/50 bg-card/30 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <IndianRupee className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-semibold text-sm">Amazon & Flipkart affiliate commissions</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                When you click "Buy on Amazon" or "Buy on Flipkart" and complete a purchase,
                we earn a small commission — typically 1-4% — at absolutely no extra cost to you.
                The price you see is the same price you pay.
              </p>
            </div>
          </div>
          <div className="border-t border-border/30 pt-4">
            <p className="text-sm font-semibold text-foreground mb-2">Why this doesn't affect our rankings:</p>
            <ul className="space-y-2">
              {[
                'Our rankings are generated by AI based purely on spec analysis against your stated needs',
                'We earn the same commission rate regardless of which laptop you buy',
                'We include an honest weakness for every recommendation — including the #1 pick',
                'We show laptops from both Amazon and Flipkart — we don\'t push one platform',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Who is this for */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Who Laptick Is For</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { who: 'First-time laptop buyer', why: 'Doesn\'t know what "H-series" or "TGP" means — just wants the right laptop' },
            { who: 'College student', why: 'Needs to balance battery life, weight, budget, and enough power for coursework' },
            { who: 'Developer switching setups', why: 'Knows they need fast compilation but doesn\'t know which laptop spec to prioritise' },
            { who: 'Parent buying for child', why: 'Wants an honest answer without getting sold up to something unnecessary' },
            { who: 'Content creator', why: 'Needs GPU + display quality but confused by which GPU is actually fast' },
            { who: 'Business professional', why: 'Needs something reliable, portable, and sharp — not gaming specs they\'ll never use' },
          ].map(({ who, why }) => (
            <div key={who} className="rounded-lg border border-border/50 p-4 space-y-1">
              <p className="font-semibold text-sm">{who}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{why}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="rounded-xl bg-accent/10 border border-accent/20 p-6 text-center space-y-3">
        <p className="font-bold text-lg">Ready? It takes 30 seconds.</p>
        <p className="text-sm text-muted-foreground">
          No signup. No email. No ads. Just your top 3 laptops with honest explanations.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 mt-1 rounded-lg bg-accent text-accent-foreground px-6 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Find My Laptop <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

    </article>
  )
}
