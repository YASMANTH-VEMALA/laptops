import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Laptop Buying Guides — Laptick',
  description:
    'Simple laptop buying guides for India — understand specs without the jargon. Best laptops by budget, use case, and brand explained in plain English.',
}

export const dynamic = 'force-dynamic'

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
    detail: 'Intel Core i7-13700H has 6 Performance cores (P) + 8 Efficiency cores (E). P-cores handle your game or code at full speed. E-cores handle Discord, Spotify, and Chrome tabs silently.',
  },
  {
    term: 'CUDA Cores',
    simple: 'The more you have, the faster your GPU calculates things.',
    detail: "RTX 4060 has 3,072 CUDA cores. Each core renders part of your game scene simultaneously. More cores = more FPS. Also critical for AI/ML: CUDA cores run neural network calculations — it's why NVIDIA dominates AI training.",
  },
  {
    term: 'Display nits (brightness)',
    simple: 'How bright your screen gets.',
    detail: '250 nits: dim, struggles in bright rooms. 300 nits: standard indoor use. 400+ nits: bright, usable near windows. 500+ nits: excellent for Indian offices with lots of natural light.',
  },
  {
    term: 'DCI-P3 % (color accuracy)',
    simple: 'How accurately your display shows colors.',
    detail: '45% sRGB: basic display, colors look washed out. 72% sRGB: standard laptop. 95%+ DCI-P3: professional-grade — colors you design look exactly right on client screens.',
  },
]

const ARTICLES = [
  { title: 'Best Laptops for Students Under ₹60,000 in India (2026)', tag: 'Students', slug: 'best-laptop-for-students-under-60k-india-2026', date: 'Published' },
  { title: 'Best Gaming Laptops Under ₹1,20,000 in India (2026)', tag: 'Gaming', slug: 'best-gaming-laptop-under-120000-india', date: 'Published' },
  { title: 'Best Laptops for Programming India', tag: 'Coding', slug: 'best-laptop-for-programming-india', date: 'Published' },
  { title: 'Best Laptops for Video Editing Under ₹1,00,000 (2026)', tag: 'Video Editing', slug: null, date: 'Coming soon' },
  { title: 'MacBook Air M4 vs Dell XPS 13: Which for Developers?', tag: 'Comparison', slug: null, date: 'Coming soon' },
  { title: 'Why Your ₹80,000 Laptop Feels Slower Than a ₹50,000 One', tag: 'Explained', slug: null, date: 'Coming soon' },
]

export default function BlogPage() {
  return (
    <div className="laptick-themed-page">
      <div className="mx-auto max-w-4xl space-y-16 px-4 pb-16 pt-8 sm:px-6">

        {/* Hero */}
        <div style={{ paddingBlock: 'clamp(1.5rem, 5vw, 4rem)' }}>
          <p className="themed-eyebrow">Buying Guides</p>
          <h1 className="themed-heading mt-4">
            Laptop specs explained in plain English.
          </h1>
          <p className="themed-subtext mt-6" style={{ maxWidth: 720 }}>
            No jargon without explanation. Know exactly what to look for before spending your money.
          </p>
        </div>


        {/* Budget Breakdown */}
        <section className="space-y-8">
          <div>
            <h2 className="themed-section-heading">What to Expect at Each Budget</h2>
            <p className="themed-body-text mt-2">Honest breakdown — no marketing fluff.</p>
          </div>
          <div className="space-y-4">
            {BUDGET_GUIDE.map((b) => (
              <div key={b.range} className="themed-card">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex-shrink-0 sm:w-44">
                    <p style={{ fontWeight: 950, color: '#00d5ff', fontSize: '0.95rem' }}>{b.range}</p>
                    <p className="themed-card-body mt-1">{b.reality}</p>
                  </div>
                  <div className="grid flex-1 gap-3 sm:grid-cols-2">
                    <div>
                      <p style={{ fontSize: '0.78rem', fontWeight: 800, color: '#22c55e', marginBottom: '0.4rem' }}>You get:</p>
                      <ul className="space-y-1">
                        {b.expect.map((e) => (
                          <li key={e} className="themed-card-body flex items-start gap-1.5">
                            <span className="flex-shrink-0" style={{ color: '#22c55e' }}>✓</span> {e}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ef4444', marginBottom: '0.4rem' }}>Don&rsquo;t expect:</p>
                      <p className="themed-card-body">{b.notExpect}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Spec Decoder */}
        <section className="space-y-8">
          <div>
            <h2 className="themed-section-heading">Spec Decoder</h2>
            <p className="themed-body-text mt-2">The 6 specs that actually matter — explained simply.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {SPEC_EXPLAINED.map((s) => (
              <div key={s.term} className="themed-card space-y-2">
                <p style={{ fontWeight: 800, fontSize: '0.95rem' }}>{s.term}</p>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#00d5ff' }}>{s.simple}</p>
                <p className="themed-card-body">{s.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Articles */}
        <section className="space-y-8">
          <div>
            <h2 className="themed-section-heading">In-Depth Articles</h2>
            <p className="themed-body-text mt-2">Deep dives — publishing soon.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {ARTICLES.map(({ title, tag, slug, date }) =>
              slug ? (
                <Link
                  key={title}
                  href={`/blog/${slug}`}
                  className="themed-card block transition-transform hover:-translate-y-0.5"
                >
                  <span className="themed-badge">{tag}</span>
                  <strong className="themed-card-title mt-2 block">{title}</strong>
                  <p className="themed-card-body mt-1">{date}</p>
                </Link>
              ) : (
                <div key={title} className="themed-card" style={{ opacity: 0.55 }}>
                  <span className="themed-badge">{tag}</span>
                  <strong className="themed-card-title mt-2 block">{title}</strong>
                  <p className="themed-card-body mt-1">{date}</p>
                </div>
              )
            )}
          </div>
        </section>

        {/* CTA */}
        <div className="themed-card" style={{ textAlign: 'center', background: '#d9ff3f' }}>
          <p style={{ fontWeight: 950, fontSize: '1.3rem' }}>Still unsure? Let us pick for you.</p>
          <p className="themed-card-body">
            Answer 5 questions — get your perfect top 3 picks with full spec explanations in 10 seconds.
          </p>
          <Link href="/find-my-laptop" className="themed-primary-action mt-3" style={{ background: 'hsl(0 0% 2%)', color: '#d9ff3f' }}>
            Find My Laptop <ArrowRight className="inline h-4 w-4" />
          </Link>
        </div>

      </div>
    </div>
  )
}
