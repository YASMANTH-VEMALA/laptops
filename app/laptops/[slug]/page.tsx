import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getServiceClient } from '@/lib/supabase'
import { AffiliateButton } from '@/components/AffiliateButton'
import { LaptopFallbackImage } from '@/components/LaptopFallbackImage'
import { SpecGrid } from '@/components/SpecBadge'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { Laptop } from '@/types/laptop'
import { generateProductSchema, generateBreadcrumbSchema } from '@/lib/seo-helpers'
import { SITE_URL, absoluteUrl } from '@/lib/site'

export const dynamic = 'force-dynamic'

const USE_LABELS: Record<string, string> = {
  'video-editing': 'Video Editing',
  programming: 'Coding',
  gaming: 'Gaming',
  general: 'General',
  business: 'Business',
  'ai-ml': 'AI / ML',
  design: 'Design',
  content: 'Content Creator',
  students: 'Students',
}

const USE_CASE_GUIDES: Record<string, { href: string; title: string; description: string }> = {
  students: {
    href: '/blog/best-laptop-for-students-under-60k-india-2026',
    title: 'Best laptops for students in India',
    description: 'Battery, weight, RAM, and budget advice for college buyers.',
  },
  gaming: {
    href: '/blog/best-gaming-laptop-under-120000-india',
    title: 'Best gaming laptops under Rs. 1,20,000',
    description: 'GPU TGP, thermals, and refresh rate explained for Indian gamers.',
  },
  programming: {
    href: '/blog/best-laptop-for-programming-india',
    title: 'Best laptops for programming',
    description: 'CPU class, RAM, SSD, keyboard, and developer workflow tradeoffs.',
  },
  'video-editing': {
    href: '/blog/best-laptops-for-video-editing-under-100k-india-2026',
    title: 'Best laptops for video editing',
    description: 'GPU, VRAM, display color, and storage picks for creator workflows.',
  },
}

function getPrimaryUseCase(laptop: Laptop) {
  return laptop.best_for?.find((tag) => tag !== 'general') || laptop.best_for?.[0] || 'general'
}

function getLaptopSeoSummary(laptop: Laptop) {
  const primaryUseCase = getPrimaryUseCase(laptop)
  const useCaseLabel = USE_LABELS[primaryUseCase] || 'Laptop Buyers'
  const gpuPart = laptop.gpu_type === 'dedicated' ? `${laptop.gpu_model} ${laptop.gpu_tgp_watts}W` : 'integrated graphics'
  const specParts = [
    laptop.cpu_model,
    gpuPart,
    `${laptop.ram_gb}GB RAM`,
    `${laptop.display_size}" ${laptop.display_type}`,
  ].filter(Boolean)

  return {
    primaryUseCase,
    useCaseLabel,
    specLine: specParts.join(', '),
  }
}

async function getLaptop(slug: string): Promise<Laptop | null> {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from('laptops')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  return (data as unknown as Laptop) ?? null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const laptop = await getLaptop(slug)
  if (!laptop) return {}

  const price = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(laptop.price_inr)

  const { primaryUseCase, useCaseLabel, specLine } = getLaptopSeoSummary(laptop)
  const description = `${laptop.name} at ${price} in India. ${specLine}. Best for ${useCaseLabel.toLowerCase()}. ${laptop.pros}`.slice(0, 158)
  const titleSpec = laptop.gpu_type === 'dedicated' ? laptop.gpu_model : laptop.cpu_model

  return {
    title: `${laptop.name} ${titleSpec} - Best for ${useCaseLabel}`,
    description,
    keywords: [laptop.brand, laptop.name, `${laptop.name} price`, `${useCaseLabel} laptop India`, primaryUseCase, 'laptop recommendation India'],
    openGraph: {
      title: `${laptop.name} - ${useCaseLabel} Laptop in India`,
      description,
      images: [
        {
          url: absoluteUrl(`/api/og/laptop/${slug}`),
          width: 1200,
          height: 630,
          alt: laptop.name
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: `${laptop.name} - Best for ${useCaseLabel}`,
      description,
      images: [absoluteUrl(`/api/og/laptop/${slug}`)]
    }
  }
}

export default async function LaptopPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const laptop = await getLaptop(slug)
  if (!laptop) notFound()

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(p)

  const specs = [
    { label: 'CPU Brand', value: laptop.cpu_brand },
    { label: 'CPU Series', value: `${laptop.cpu_series}-series`, highlight: laptop.cpu_series === 'H' || laptop.cpu_series === 'HX' },
    { label: 'GPU', value: laptop.gpu_type === 'dedicated' ? laptop.gpu_model : 'Integrated' },
    { label: 'GPU TGP', value: laptop.gpu_tgp_watts > 0 ? `${laptop.gpu_tgp_watts}W` : 'N/A', highlight: laptop.gpu_tgp_watts >= 80 },
    { label: 'RAM', value: `${laptop.ram_gb}GB`, highlight: laptop.ram_gb >= 16 },
    { label: 'RAM Type', value: laptop.ram_type },
    { label: 'Storage', value: `${laptop.storage_gb}GB` },
    { label: 'Storage Type', value: laptop.storage_type },
    { label: 'Display', value: `${laptop.display_size}"` },
    { label: 'Panel', value: laptop.display_type, highlight: laptop.display_type === 'OLED' },
    { label: 'Refresh', value: `${laptop.display_hz}Hz`, highlight: laptop.display_hz >= 120 },
    { label: 'Brightness', value: `${laptop.display_nits} nits`, highlight: laptop.display_nits >= 400 },
    { label: 'Battery', value: `${laptop.battery_wh}Wh`, highlight: laptop.battery_wh >= 70 },
    { label: 'Weight', value: `${laptop.weight_kg}kg` },
  ]

  const { primaryUseCase, useCaseLabel, specLine } = getLaptopSeoSummary(laptop)
  const primaryGuide = USE_CASE_GUIDES[primaryUseCase]
  const relatedGuideCandidates = [
    primaryGuide,
    laptop.gpu_type === 'dedicated' ? USE_CASE_GUIDES.gaming : undefined,
    laptop.best_for.includes('programming') ? USE_CASE_GUIDES.programming : undefined,
    laptop.best_for.includes('students') ? USE_CASE_GUIDES.students : undefined,
    { href: '/faq', title: 'Laptop buying FAQ', description: 'Answers on RAM, CPU, GPU TGP, displays, and budgets.' },
  ]
  const learnMoreLinks = relatedGuideCandidates.reduce<Array<{ href: string; title: string; description: string }>>((links, link) => {
    if (link && !links.some((item) => item.href === link.href)) {
      links.push(link)
    }
    return links
  }, [])

  const productSchema = generateProductSchema(laptop)
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'All Laptops', url: absoluteUrl('/laptops') },
    { name: laptop.name, url: absoluteUrl(`/laptops/${laptop.slug}`) }
  ])

  return (
    <>
      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema).replace(/</g, '\\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema).replace(/</g, '\\u003c') }}
      />

      <article className="laptop-detail-page mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8 space-y-6">
        {/* Breadcrumb */}
        <nav className="flex border-2 border-foreground bg-background p-3 text-xs font-black uppercase tracking-[0.14em] text-muted-foreground shadow-[6px_6px_0_var(--foreground)]">
          <Link href="/laptops" className="hover:bg-primary hover:text-foreground">Back to data console</Link>
          <span>/</span>
          <span className="line-clamp-1">{laptop.name}</span>
      </nav>

      {/* Header */}
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden border-2 border-foreground bg-secondary shadow-[6px_6px_0_var(--foreground)]">
          {laptop.image_url ? (
            <Image
              src={laptop.image_url}
              alt={laptop.name}
              fill
              className="object-contain p-6"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <LaptopFallbackImage brand={laptop.brand} name={laptop.name} />
          )}
        </div>

        {/* Details */}
        <div className="space-y-4 border-2 border-foreground bg-background p-5 shadow-[6px_6px_0_var(--foreground)]">
          <div>
            <Badge variant="secondary" className="mb-3 rounded-none border-2 border-foreground bg-primary text-xs font-black text-foreground">{laptop.brand}</Badge>
            <h1 className="font-display text-[clamp(2.8rem,6vw,6rem)] font-extrabold leading-[0.8] tracking-normal">{laptop.name}</h1>
            <p className="mt-3 text-sm font-black uppercase tracking-[0.16em] text-muted-foreground">
              Best for {useCaseLabel} - {specLine}
            </p>
            <p className="mt-4 text-4xl font-black text-accent">
              {formatPrice(laptop.price_inr)}
            </p>
          </div>

          {/* Use case tags */}
          <div className="flex flex-wrap gap-1.5">
            {laptop.best_for.map((tag) => (
              <Badge key={tag} variant="outline" className="rounded-none border-foreground bg-secondary text-xs font-black">
                {USE_LABELS[tag] ?? tag}
              </Badge>
            ))}
          </div>

          {/* Pros */}
          <div className="border-2 border-foreground bg-primary p-4 shadow-[4px_4px_0_var(--foreground)]">
            <p className="mb-1 font-mono text-xs font-black uppercase tracking-[0.14em] text-foreground">Why it&apos;s good</p>
            <p className="text-sm leading-relaxed">{laptop.pros}</p>
          </div>

          {/* Cons */}
          <div className="border-2 border-foreground bg-secondary p-4">
            <p className="mb-1 font-mono text-xs font-black uppercase tracking-[0.14em] text-foreground">One weakness</p>
            <p className="text-sm leading-relaxed">{laptop.cons}</p>
          </div>

          <AffiliateButton
            url={laptop.affiliate_amazon_in}
            laptopName={laptop.name}
            price={laptop.price_inr}
            size="lg"
          />
          <p className="text-xs text-muted-foreground">
            As an Amazon Associate, we earn from qualifying purchases.
          </p>
        </div>
      </div>

      <Separator className="bg-foreground" />

      {/* Full spec grid */}
      <section className="border-2 border-foreground bg-background p-5 shadow-[6px_6px_0_var(--foreground)]">
        <h2 className="mb-4 font-display text-5xl font-extrabold leading-none">Full Specifications</h2>
        <SpecGrid specs={specs} />
      </section>

      {/* Spec explanations — plain English */}
      <section className="space-y-4">
        <h2 className="font-display text-5xl font-extrabold leading-none">What these specs mean for you</h2>

        {laptop.gpu_type === 'dedicated' && laptop.gpu_tgp_watts > 0 && (
          <div className="border-2 border-foreground bg-background p-4 shadow-[4px_4px_0_var(--foreground)]">
            <p className="font-semibold text-sm mb-1">GPU: {laptop.gpu_model} at {laptop.gpu_tgp_watts}W TGP</p>
            <p className="text-sm text-muted-foreground">
              TGP (Total Graphics Power) is the actual wattage your GPU runs at. The same RTX 4060 at 80W
              is 40% faster than at 50W. {laptop.gpu_tgp_watts >= 80 ? `This laptop's ${laptop.gpu_tgp_watts}W is on the higher end — good for serious gaming and video rendering.` : `At ${laptop.gpu_tgp_watts}W, this is a power-efficient variant — great for battery, lighter for heavy rendering tasks.`}
            </p>
          </div>
        )}

        {laptop.ram_gb <= 8 && (
          <div className="border-2 border-foreground bg-primary p-4 shadow-[4px_4px_0_var(--foreground)]">
            <p className="font-semibold text-sm mb-1 text-foreground">8GB RAM Warning</p>
            <p className="text-sm text-muted-foreground">
              8GB is the absolute minimum for modern Windows laptops. You will notice slowdowns
              with 15+ browser tabs, running background apps, or any creative software. If possible,
              choose a 16GB variant or upgrade before purchasing.
            </p>
          </div>
        )}

        <div className="border-2 border-foreground bg-background p-4 shadow-[4px_4px_0_var(--foreground)]">
          <p className="font-semibold text-sm mb-1">Display: {laptop.display_size}&quot; {laptop.display_type} at {laptop.display_hz}Hz</p>
          <p className="text-sm text-muted-foreground">
            {laptop.display_type === 'OLED'
              ? 'OLED panels have perfect blacks, infinite contrast, and excellent colour accuracy — ideal for design and video work. Watch content on this and regular IPS screens look flat by comparison.'
              : laptop.display_type === 'IPS'
              ? 'IPS panels offer good colour accuracy and wide viewing angles. The gold standard for most users.'
              : 'TN panels are the cheapest but have poor colour accuracy and narrow viewing angles — acceptable for pure gaming at high Hz.'}
            {laptop.display_hz >= 120 ? ` ${laptop.display_hz}Hz makes scrolling and gaming visibly smoother than 60Hz — you notice the difference immediately.` : ' 60Hz is standard and sufficient for most non-gaming tasks.'}
          </p>
        </div>
      </section>

      {/* Related guides */}
      <section className="border-2 border-foreground bg-background p-5 shadow-[6px_6px_0_var(--foreground)]">
        <h2 className="mb-4 font-display text-5xl font-extrabold leading-none">Learn More Before You Buy</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {learnMoreLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block border-2 border-foreground bg-secondary p-4 shadow-[4px_4px_0_var(--foreground)] transition hover:-translate-y-0.5"
            >
              <p className="text-base font-black text-foreground">{link.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{link.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Get personalised recommendation CTA */}
      <div className="border-2 border-foreground bg-primary p-6 text-center shadow-[6px_6px_0_var(--foreground)] space-y-3">
        <p className="font-semibold">Not sure if this is right for you?</p>
        <p className="text-sm text-muted-foreground">
          Answer 5 questions and get a personalised ranking with expert explanations — free.
        </p>
        <Link
          href="/laptops"
          className="inline-block border-2 border-foreground bg-background px-6 py-2.5 text-sm font-black text-foreground shadow-[4px_4px_0_var(--foreground)] transition hover:-translate-x-0.5 hover:-translate-y-0.5"
        >
          Ask the data agent
        </Link>
      </div>
    </article>
    </>
  )
}
