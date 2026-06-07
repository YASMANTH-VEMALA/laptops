import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Laptop Buying Guides — Laptick',
  description:
    'Simple laptop buying guides for India — understand specs without the jargon. Best laptops by budget, use case, and brand explained in plain English.',
}

export const dynamic = 'force-dynamic'

const USE_CASE_GUIDES = [
  {
    emoji: '🎓',
    title: 'For Students & College',
    budget: 'Best at ₹40,000 – ₹80,000',
    what: 'You need a laptop that lasts your entire college day without a charger, handles assignments, video calls, and some light entertainment.',
    mustHave: ['8+ hours real battery life', '8GB RAM minimum (16GB better)', 'IPS or OLED display (easier on eyes)', 'Weight under 1.8kg for backpack'],
    avoid: 'Avoid gaming laptops — they are heavy, drain battery in 3 hours, and overheat in bags.',
    badge: 'Students',
    color: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    emoji: '🎮',
    title: 'For Gamers',
    budget: 'Best at ₹80,000 – ₹1,50,000',
    what: 'Gaming performance is NOT about the GPU name. An RTX 4060 at 45W (thin laptop) is 40% slower than the same RTX 4060 at 80W (proper gaming chassis).',
    mustHave: ['GPU TGP 75W+ for serious gaming', '144Hz display minimum', '16GB RAM (8GB throttles in new games)', 'Check chassis thickness — under 20mm = thermal throttle'],
    avoid: 'Avoid ultra-thin "gaming" laptops. Thin chassis cannot cool 80W+ GPUs — they throttle within 10 minutes.',
    badge: 'Gaming',
    color: 'bg-red-500/10 border-red-500/20',
  },
  {
    emoji: '💻',
    title: 'For Programmers & Developers',
    budget: 'Best at ₹60,000 – ₹1,20,000',
    what: 'You need a fast CPU for compilation, enough RAM for Docker and multiple apps running simultaneously, and a comfortable keyboard for 8+ hours of typing.',
    mustHave: ['16GB RAM minimum (32GB for heavy Docker use)', 'H-series Intel or Ryzen (not U-series — too slow for compilation)', '512GB+ NVMe SSD (faster project load times)', 'Good keyboard with 1.5mm+ key travel'],
    avoid: 'Avoid laptops with soldered 8GB RAM — you cannot upgrade later and 8GB will choke VS Code + Chrome + Docker.',
    badge: 'Coding',
    color: 'bg-green-500/10 border-green-500/20',
  },
  {
    emoji: '🎬',
    title: 'For Video Editors & Creators',
    budget: 'Best at ₹1,00,000 – ₹2,00,000',
    what: 'Video editing is the most demanding laptop task. You need dedicated GPU for real-time effects, lots of RAM to hold 4K footage in memory, and a color-accurate display.',
    mustHave: ['Dedicated GPU 6GB+ VRAM', '16GB RAM (32GB for 4K)', 'Display with 95%+ DCI-P3 color accuracy', 'Fast NVMe SSD (footage reads constantly)'],
    avoid: 'Avoid integrated-GPU-only laptops — without a dedicated GPU, Premiere Pro and DaVinci Resolve are painfully slow.',
    badge: 'Video Editing',
    color: 'bg-purple-500/10 border-purple-500/20',
  },
  {
    emoji: '💼',
    title: 'For Business & Professionals',
    budget: 'Best at ₹80,000 – ₹2,00,000',
    what: 'Business professionals need a laptop that looks professional in meetings, has a sharp display for long days of work, and a keyboard you can type 5,000+ words on comfortably.',
    mustHave: ['300+ nits display (dim screens wash out in bright offices)', 'Good webcam — 1080p minimum for video calls', 'Solid build (aluminum or carbon fiber)', 'Lightweight — under 1.5kg for frequent travel'],
    avoid: 'Avoid plastic-chassis budget laptops — they creak, flex, and look unprofessional in client meetings.',
    badge: 'Business',
    color: 'bg-amber-500/10 border-amber-500/20',
  },
]

const BUDGET_GUIDE = [
  {
    range: 'Under ₹50,000',
    reality: 'Basic everyday laptop. Fine for assignments, browsing, YouTube, Word/Excel. Cannot game, edit video, or run heavy software.',
    expect: ['Intel Core i3 or AMD Ryzen 5 U-series', '8GB RAM (tight but workable)', '60Hz display', '5-6 hour real battery'],
    notExpect: 'Dedicated GPU, fast compilation, smooth gaming',
  },
  {
    range: '₹50,000 – ₹80,000',
    reality: 'Solid all-rounder. Good for students, light coders, and most office work. Some options have OLED displays at this range.',
    expect: ['AMD Ryzen 7 or Intel Core i5 (H or U)', '16GB RAM in most good options', 'IPS or OLED display in premium picks', '7-10 hour battery'],
    notExpect: 'Dedicated GPU for gaming, 4K export speed',
  },
  {
    range: '₹80,000 – ₹1,20,000',
    reality: 'The sweet spot. Entry gaming, comfortable coding, light video editing. MacBook Air M4 sits here — best battery life money can buy.',
    expect: ['Entry dedicated GPU (RTX 4050/4060)', 'MacBook Air M4 (18hr battery, fanless)', 'OLED display options', 'Fast NVMe Gen 4 SSD'],
    notExpect: 'Ultra-high gaming FPS, heavy 3D rendering',
  },
  {
    range: '₹1,20,000 – ₹2,00,000',
    reality: 'Pro-level performance. Serious gaming, video editing, professional work. This is where dedicated GPU performance really opens up.',
    expect: ['RTX 5060/4070 gaming GPU', 'Core Ultra 7 or Ryzen 9 processors', '32GB RAM options', 'High-refresh OLED or 2K displays'],
    notExpect: 'Extreme GPU power (that needs ₹2L+)',
  },
  {
    range: 'Above ₹2,00,000',
    reality: 'Workstation-class or desktop-replacement gaming. For professionals who need maximum performance — 3D artists, AI researchers, competitive gamers.',
    expect: ['RTX 5070/4080 and above', 'RTX 3080 Ti for AI/ML work (16GB VRAM)', '32-64GB RAM', 'QHD or 4K displays at 165-240Hz'],
    notExpect: 'Good battery life (these machines prioritise performance over portability)',
  },
]

const SPEC_EXPLAINED = [
  {
    term: 'GPU TGP (Watts)',
    simple: 'The most important gaming spec nobody tells you about.',
    detail: 'Same GPU model, completely different performance based on wattage. RTX 4060 at 45W (thin laptops) delivers 40 FPS. RTX 4060 at 80W (proper gaming) delivers 65 FPS. Always check the wattage, not just the model name.',
  },
  {
    term: 'H-series vs U-series CPU',
    simple: 'H = powerful, runs hot. U = efficient, cooler.',
    detail: 'Intel i7-13700H (H-series, 45W) compiles code 3× faster than i5-1335U (U-series, 15W). For gaming and coding, always prefer H-series. For light office work and battery life, U-series is fine.',
  },
  {
    term: 'P-cores vs E-cores',
    simple: 'Two types of cores working as a team.',
    detail: 'Intel Core i7-13700H has 6 Performance cores (P) + 8 Efficiency cores (E). P-cores handle your game or code at full speed. E-cores handle Discord, Spotify, and Chrome tabs silently. This is why your laptop never stutters even with 20 tabs open.',
  },
  {
    term: 'CUDA Cores',
    simple: 'The more you have, the faster your GPU calculates things.',
    detail: 'RTX 4060 has 3,072 CUDA cores. Each core renders part of your game scene simultaneously. More cores = more FPS. Also critical for AI/ML: CUDA cores run neural network calculations — it\'s why NVIDIA dominates AI training.',
  },
  {
    term: 'Display nits (brightness)',
    simple: 'How bright your screen gets.',
    detail: '250 nits: dim, struggles in bright rooms. 300 nits: standard indoor use. 400+ nits: bright, usable near windows. 500+ nits: excellent for Indian offices with lots of natural light. For video calls, 400+ nits ensures your face looks properly lit on camera.',
  },
  {
    term: 'DCI-P3 % (color accuracy)',
    simple: 'How accurately your display shows colors.',
    detail: '45% sRGB: basic display, colors look washed out. 72% sRGB: standard laptop. 95%+ DCI-P3: professional-grade — colors you design look exactly right on client screens. If you edit photos, design, or color-grade video, never go below 90% DCI-P3.',
  },
]

const ARTICLES = [
  { title: 'Best Laptops for Students Under ₹60,000 in India (2026)', tag: 'Students', date: 'Coming soon' },
  { title: 'Best Gaming Laptops Under ₹1,20,000 in India (2026)', tag: 'Gaming', date: 'Coming soon' },
  { title: 'Best Laptops for Video Editing Under ₹1,00,000 (2026)', tag: 'Video Editing', date: 'Coming soon' },
  { title: 'MacBook Air M4 vs Dell XPS 13: Which for Developers?', tag: 'Comparison', date: 'Coming soon' },
  { title: 'Why Your ₹80,000 Laptop Feels Slower Than a ₹50,000 One', tag: 'Explained', date: 'Coming soon' },
  { title: 'GPU TGP Explained: The Spec Nobody Mentions But Changes Everything', tag: 'Explained', date: 'Coming soon' },
]

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-14">

      {/* Hero */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold">Laptop Buying Guides</h1>
        <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
          Laptop specs explained in plain English — no jargon without explanation.
          Know exactly what to look for before spending your money.
        </p>
      </div>

      {/* By Use Case */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Choose by What You Do</h2>
          <p className="text-muted-foreground text-sm mt-1">Different work needs completely different specs. Start here.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {USE_CASE_GUIDES.map((g) => (
            <div key={g.title} className={`rounded-xl border p-5 space-y-4 ${g.color}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-2xl">{g.emoji}</span>
                  <h3 className="font-bold text-base mt-1">{g.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{g.budget}</p>
                </div>
                <Badge variant="secondary" className="text-xs flex-shrink-0">{g.badge}</Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{g.what}</p>
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">Must have:</p>
                <ul className="space-y-1">
                  {g.mustHave.map((item) => (
                    <li key={item} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2">
                <p className="text-xs text-red-400"><span className="font-semibold">Avoid:</span> {g.avoid}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Budget Breakdown */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">What to Expect at Each Budget</h2>
          <p className="text-muted-foreground text-sm mt-1">Honest breakdown — no marketing fluff.</p>
        </div>
        <div className="space-y-3">
          {BUDGET_GUIDE.map((b) => (
            <div key={b.range} className="rounded-xl border border-border/50 bg-card/30 p-5">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="sm:w-44 flex-shrink-0">
                  <p className="font-bold text-accent text-sm">{b.range}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{b.reality}</p>
                </div>
                <div className="flex-1 grid sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold text-green-500 mb-1.5">You get:</p>
                    <ul className="space-y-1">
                      {b.expect.map((e) => (
                        <li key={e} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="text-green-500 flex-shrink-0">✓</span> {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-red-400 mb-1.5">Don't expect:</p>
                    <p className="text-xs text-muted-foreground">{b.notExpect}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Spec Decoder */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Spec Decoder</h2>
          <p className="text-muted-foreground text-sm mt-1">The 6 specs that actually matter — explained simply.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {SPEC_EXPLAINED.map((s) => (
            <div key={s.term} className="rounded-xl border border-border/50 bg-card/30 p-5 space-y-2">
              <p className="font-bold text-sm text-foreground">{s.term}</p>
              <p className="text-xs font-medium text-accent">{s.simple}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{s.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Articles */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">In-Depth Articles</h2>
          <p className="text-muted-foreground text-sm mt-1">Deep dives — publishing soon.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {ARTICLES.map(({ title, tag, date }) => (
            <div
              key={title}
              className="rounded-xl border border-border/50 bg-card/30 p-5 space-y-3 hover:border-border transition-colors"
            >
              <Badge variant="secondary" className="text-xs">{tag}</Badge>
              <h3 className="font-semibold text-sm leading-snug">{title}</h3>
              <p className="text-xs text-muted-foreground">{date}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="rounded-xl bg-accent/10 border border-accent/20 p-6 text-center space-y-3">
        <p className="font-bold text-lg">Still unsure? Let us pick for you.</p>
        <p className="text-sm text-muted-foreground">
          Answer 5 questions — get your perfect top 3 picks with full spec explanations in 10 seconds.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 mt-1 rounded-lg bg-accent text-accent-foreground px-6 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Find My Laptop <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

    </div>
  )
}
