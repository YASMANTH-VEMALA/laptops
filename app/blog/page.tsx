import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'Laptop Buying Guides & Articles',
  description:
    'Expert laptop buying guides for India — best laptops by use case, budget, and brand. Written in plain English with real spec explanations.',
}

export const dynamic = 'force-dynamic'

export default async function BlogPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Laptop Buying Guides</h1>
        <p className="text-muted-foreground">
          Plain-English guides on laptop specs, buying decisions, and use-case recommendations.
          No jargon without explanation.
        </p>
      </div>

      {/* What to Check Section */}
      <section className="space-y-4 rounded-lg border border-border p-6 bg-secondary">
        <h2 className="text-xl font-bold">What to Check When Buying a Laptop</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              title: 'Processor (CPU) - Microarchitecture & Thermal Design',
              details: 'Analyze P-core vs E-core topology. Process node (5nm TSMC vs 7nm Samsung) impacts IPC (Instructions Per Cycle) and efficiency. Check sustained TDP under Cinebench R23, not just PL1/PL2. Zen 5 (Ryzen 9 9950X) offers superior L3 cache vs Zen 4. Boost throttling diminishes single-thread performance 15-30% under thermal load. Verify thermal compound type (liquid metal vs solder) for sustained boost.',
            },
            {
              title: 'Graphics (GPU) - VRAM Architecture & Bandwidth',
              details: 'GPU TGP correlates to VRAM bandwidth. RTX 4060 (45W) bottlenecks at 1440p vs RTX 4070 (130W) with GDDR6 192-bit bus. iGPU (Intel Arc 140V, AMD 780M) suffers 40-60% delta due to shared RAM latency. Memory config priority: GDDR6X, GDDR6, HBM2e. Ray-tracing and DLSS 3.5 essential. APU compute units matter for ML (NVIDIA CUDA vs AMD RDNA).',
            },
            {
              title: 'RAM - Memory Hierarchy & Overclocking',
              details: 'LPDDR5X-8533 beats LPDDR5-6400 by 18% in bandwidth workloads. Dual-channel mandatory (8GB+8GB over 16GB single). Check CAS latency: CAS 28 LPDDR5X beats CAS 40 LPDDR5. Soldered DRAM blocks upgrades. Thermal throttling above 50°C under load. Apple unified memory (M3/M4) bypasses PCIe for 2.5x gain vs discrete VRAM.',
            },
            {
              title: 'Display - Panel Technology & Color Science',
              details: 'IPS vs VA vs OLED panels. DCI-P3 gamut coverage (100% P3 vs 72% sRGB) for color work. SDR 300-400 nits vs HDR 800-1500 nits for outdoor visibility. 60Hz fine for work, 144Hz+ for esports. GtG response time affects blur (Razer 0.5ms vs standard 5ms). Matte coating reduces glare but lowers brightness 3-5%. Delta-E under 2 critical for color-accurate work.',
            },
            {
              title: 'Battery - Power Profile & Thermal Envelope',
              details: 'Wh capacity does not equal runtime. Intel H draws 45W idle baseline (U 8-12W). Mixed 80% brightness: H 25-30W/hr, U 8-12W/hr. Li-Ion vs Li-Po affects durability (500-800 cycles at 80%). Fast-charge support (USB PD 100W+). QC cycles: 80°C sustained degrades Li-Ion 2.3% per 100 hours. Windows Modern Standby uses 1-2W vs deep sleep 0.5W.',
            },
            {
              title: 'Storage - Form Factor & NAND Controller',
              details: 'NVMe Gen4 7000MB/s QD32 vs Gen5 14000MB/s on newer boards. SLC cache speeds I/O; large cache reduces 4K stalls. PCIe Gen4 max 4GB/s, Gen5 needs platform support (Intel 14th+). DRAM-less controllers add latency 25-40%. Thermal throttling above 80°C. Soldered storage unfixable. Enterprise drives (PM1733) offer MTBF 2.5M hours.',
            },
            {
              title: 'Thermals & VRM - Sustained Performance',
              details: 'Vapor chamber dissipates 20-30% more via phase-change. Junction limits: Intel 110C, AMD 95C. Throttle points 95-105C. VRM 14+2+1 phases maintain stable voltage. Flaws: thick chassis pressure, poor interface, aggressive fan curves (50dB). Undervolting offset -50mV drops temps 8-12C safely.',
            },
            {
              title: 'Mechanical & Port Architecture',
              details: 'USB 3.2 Gen2x2 20Gbps sustained vs 10Gbps older. Thunderbolt 4 40Gbps daisy-chain for external GPU/RAID. Intel Z790/H870 unlock PCIe Gen5. HDMI 2.1 handles 4K 120Hz or 8K 60Hz. Realtek ALC vs Cirrus CS42L42 (better noise floor). Hinge rated 20,000 cycles. Mechanical switches best for endurance (50M keystrokes).',
            },
            {
              title: 'Power Efficiency & Undervolt Headroom',
              details: 'Silicon lottery affects overclocking/undervolting. Process variation determines stable -40mV to -80mV. Efficiency: Ryzen 7 7735HS (16c 45W) beats i7-13700H (14c 55W) at same power. C6/C7 residency critical. Intel P-state 100MHz steps vs older ACPI 25MHz waste. EC firmware affects DVFS tuning.',
            },
            {
              title: 'Benchmarking Methodology - Synthetic vs Real-World',
              details: 'Geekbench 6 multicore normalizes OS overhead, not gaming. Cinebench R23 tests all-core, 2024 shows variance. Handbrake H.265: measure wall-clock, not throughput. SpecViewPerf 2020 for pro GPU. Run benchmarks 4x for throttling curves. Hardware encoders (NVENC/QSV) 5-8x faster but lower quality.',
            },
            {
              title: 'Regional Component Variance & Compliance',
              details: 'India Intel H may use binned silicon (lower bin -50MHz). Asus uses Shin-Etsu X-23 paste, Lenovo cheaper (2-3C delta). 2024 models better EMI vs 2023. Warranty: US/EU 2yr, India 1yr. Apple 95% parts available vs Chinese OEMs 40-60%. BIOS security patches (Spectre/Meltdown) reduce performance 3-8%.',
            },
          ].map(({ title, details }) => (
            <div key={title} className="space-y-2">
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{details}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Coming soon placeholder — populated after seeding blog_posts table */}
      <div className="grid gap-6 sm:grid-cols-2">
        {[
          { title: 'Best Laptops for Students Under ₹60,000 in India (2026)', tag: 'Students', date: 'Coming soon' },
          { title: 'Best Laptops for Video Editing Under ₹1,00,000 (2026)', tag: 'Video Editing', date: 'Coming soon' },
          { title: 'MacBook Air M3 vs Dell XPS 13: Which for Developers?', tag: 'Comparison', date: 'Coming soon' },
          { title: 'Why Your ₹80,000 Laptop Feels Slower Than a ₹50,000 One', tag: 'Explained', date: 'Coming soon' },
          { title: 'GPU TGP Explained: The Spec That Changes Everything', tag: 'Explained', date: 'Coming soon' },
          { title: 'Best Gaming Laptops Under ₹1,20,000 in India (2026)', tag: 'Gaming', date: 'Coming soon' },
        ].map(({ title, tag, date }) => (
          <div
            key={title}
            className="rounded-xl border border-border/50 bg-card/30 p-5 space-y-3 hover:border-border transition-colors"
          >
            <Badge variant="secondary" className="text-xs">{tag}</Badge>
            <h2 className="font-semibold text-sm leading-snug">{title}</h2>
            <p className="text-xs text-muted-foreground">{date}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-blue-600/10 border border-blue-500/30 p-6 text-center space-y-2">
        <p className="font-semibold">Want a personalised recommendation now?</p>
        <p className="text-sm text-muted-foreground">
          Don't wait for the guide — get your personalised top 3 in 30 seconds.
        </p>
        <Link
          href="/"
          className="inline-block mt-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Find My Laptop →
        </Link>
      </div>
    </div>
  )
}
