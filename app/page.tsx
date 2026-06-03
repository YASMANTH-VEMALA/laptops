import type { Metadata } from 'next'
import Link from 'next/link'
import { Cpu, Zap, Shield, TrendingUp, Users, Star } from 'lucide-react'
import { RecommendationForm } from '@/components/RecommendationForm'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'Find Your Perfect Laptop in India — AI Recommendations',
  description:
    'Answer 5 simple questions and get the top 3 laptops for your exact use case — with expert explanations of every spec. Free, no signup, updated weekly.',
}

const TRUST_SIGNALS = [
  { icon: Cpu, text: 'Real hardware specs — not marketing copy' },
  { icon: Shield, text: 'Honest weaknesses included, always' },
  { icon: TrendingUp, text: 'Prices updated every Monday' },
  { icon: Zap, text: 'Results in under 5 seconds' },
]

const USE_CASES = [
  { label: 'Students', desc: 'Balance of price, battery & portability' },
  { label: 'Developers', desc: 'Sustained CPU performance & RAM' },
  { label: 'Video Editors', desc: 'GPU TGP wattage & color-accurate display' },
  { label: 'Gamers', desc: 'GPU power envelope & thermal design' },
  { label: 'Business', desc: 'Build quality, display brightness & weight' },
  { label: 'AI / ML', desc: 'VRAM, RAM ≥32GB & CUDA cores' },
]

const EXAMPLE_EXPLANATIONS = [
  {
    laptop: 'ASUS Vivobook Pro 15',
    use: 'Video Editing',
    explanation:
      'The RTX 4060 here runs at 65W TGP — not the 45W "Max-Q" version in thinner laptops. That 20W difference means your 4K Premiere timeline renders 40% faster. The 16GB LPDDR5 RAM ensures Premiere Pro never swaps to disk mid-edit.',
  },
  {
    laptop: 'MacBook Air M3',
    use: 'Software Development',
    explanation:
      'Apple Silicon\'s unified memory means 16GB performs like 24GB on x86. The M3 chip sustains performance indefinitely without fan noise — ideal for long compile sessions. Battery lasts 12+ hours real-world, not the 3–4 hours you get from i7 thin laptops.',
  },
  {
    laptop: 'Lenovo IdeaPad Slim 5',
    use: 'Students',
    explanation:
      'The Ryzen 5 7530U runs at 15W — why? Because a thin ₹55k laptop can\'t cool a 45W chip. That\'s fine for your use case: word processing and coding compile in seconds. The 50Wh battery gives 7–8 hours of real classroom use.',
  },
]

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-20 text-center sm:py-28">
        {/* Background gradient */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-blue-600/10 blur-3xl" />
        </div>

        <Badge variant="outline" className="mb-4 border-blue-500/40 text-blue-400">
          AI-Powered · Updated Weekly · Free
        </Badge>
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          Stop guessing which laptop to buy.
          <span className="block mt-2 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Get expert advice in 30 seconds.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Most people buy laptops based on brand name and price. We analyse actual hardware specs —
          CPU sustained wattage, GPU TGP, display color accuracy — and explain{' '}
          <em>why</em> a laptop is right for YOUR exact use case.
        </p>

        {/* Stats */}
        <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          {[
            ['100+', 'Laptops in database'],
            ['₹30k–₹3L', 'Price range covered'],
            ['7 use cases', 'Student to AI/ML Engineer'],
          ].map(([num, label]) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-bold text-foreground">{num}</p>
              <p>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Form section */}
      <section id="find-laptop" className="px-4 pb-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-2 text-center text-2xl font-bold">
            Answer 5 questions. Get your top 3 laptops.
          </h2>
          <p className="mb-8 text-center text-sm text-muted-foreground">
            No signup. No email. Just submit and get expert recommendations instantly.
          </p>
          <RecommendationForm />
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border/40 bg-muted/10 px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-2xl font-bold">
            Why Laptick is different
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_SIGNALS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex flex-col items-center gap-3 text-center p-4">
                <div className="rounded-full bg-blue-500/10 p-3">
                  <Icon className="h-6 w-6 text-blue-400" />
                </div>
                <p className="text-sm font-medium">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Real explanation examples */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-3 text-center text-2xl font-bold">
            Not "this is good" — but "good FOR YOU because..."
          </h2>
          <p className="mb-10 text-center text-muted-foreground">
            Every recommendation comes with a plain-English explanation of the exact specs that matter
            for your workflow.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {EXAMPLE_EXPLANATIONS.map(({ laptop, use, explanation }) => (
              <div
                key={laptop}
                className="rounded-xl border border-border/50 bg-card/50 p-5 space-y-3"
              >
                <div>
                  <Badge variant="secondary" className="text-xs mb-2">
                    {use}
                  </Badge>
                  <p className="font-semibold text-sm">{laptop}</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  &ldquo;{explanation}&rdquo;
                </p>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="ml-1 text-xs text-muted-foreground">Expert analysis</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="border-t border-border/40 bg-muted/10 px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-2xl font-bold">
            Who is this for?
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {USE_CASES.map(({ label, desc }) => (
              <div
                key={label}
                className="flex items-start gap-3 rounded-lg border border-border/50 p-4 hover:border-border transition-colors"
              >
                <div className="mt-0.5 rounded-md bg-blue-500/10 p-1.5">
                  <Users className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 text-center">
        <div className="mx-auto max-w-xl space-y-4">
          <h2 className="text-2xl font-bold">Ready to find your laptop?</h2>
          <p className="text-muted-foreground">
            Takes 30 seconds. No account needed. Results you can trust.
          </p>
          <Link
            href="#find-laptop"
            className="inline-block rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 font-semibold text-white hover:from-blue-700 hover:to-indigo-700 transition-all"
          >
            Find My Perfect Laptop →
          </Link>
        </div>
      </section>
    </div>
  )
}
