import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getServiceClient } from '@/lib/supabase'
import { AffiliateButton } from '@/components/AffiliateButton'
import { SpecGrid } from '@/components/SpecBadge'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { Laptop } from '@/types/laptop'
import { generateProductSchema, generateBreadcrumbSchema } from '@/lib/seo-helpers'

export const dynamic = 'force-dynamic'

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

  return {
    title: `${laptop.name} Review & Price in India (2026)`,
    description: `${laptop.name} at ${price} on Amazon India. ${laptop.pros.slice(0, 120)}`,
    keywords: [laptop.brand, laptop.name, 'laptop', 'price', 'india'],
    openGraph: {
      title: `${laptop.name} Review & Price in India (2026)`,
      description: `${laptop.name} at ${price} on Amazon India`,
      images: [
        {
          url: `https://laptick.in/api/og/laptop/${slug}`,
          width: 1200,
          height: 630,
          alt: laptop.name
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: `${laptop.name} Review & Price`,
      description: `${laptop.name} at ${price}`,
      images: [`https://laptick.in/api/og/laptop/${slug}`]
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

  const productSchema = generateProductSchema(laptop)
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://laptick.in' },
    { name: 'All Laptops', url: 'https://laptick.in/laptops' },
    { name: laptop.name, url: `https://laptick.in/laptops/${laptop.slug}` }
  ])

  return (
    <>
      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <article className="mx-auto max-w-4xl px-4 py-10 space-y-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-muted-foreground flex gap-2">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link href="/laptops" className="hover:text-foreground">Laptops</Link>
        <span>/</span>
        <span>{laptop.name}</span>
      </nav>

      {/* Header */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted/30">
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
            <div className="flex h-full items-center justify-center text-6xl">💻</div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div>
            <Badge variant="secondary" className="mb-2 text-xs">{laptop.brand}</Badge>
            <h1 className="text-2xl font-bold">{laptop.name}</h1>
            <p className="mt-2 text-3xl font-extrabold text-blue-400">
              {formatPrice(laptop.price_inr)}
            </p>
          </div>

          {/* Use case tags */}
          <div className="flex flex-wrap gap-1.5">
            {laptop.best_for.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {USE_LABELS[tag] ?? tag}
              </Badge>
            ))}
          </div>

          {/* Pros */}
          <div className="rounded-lg bg-green-500/5 border border-green-500/20 p-4">
            <p className="text-xs font-semibold text-green-400 mb-1">Why it's good</p>
            <p className="text-sm leading-relaxed">{laptop.pros}</p>
          </div>

          {/* Cons */}
          <div className="rounded-lg bg-orange-500/5 border border-orange-500/20 p-4">
            <p className="text-xs font-semibold text-orange-400 mb-1">One weakness</p>
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

      <Separator />

      {/* Full spec grid */}
      <section>
        <h2 className="text-xl font-bold mb-4">Full Specifications</h2>
        <SpecGrid specs={specs} />
      </section>

      {/* Spec explanations — plain English */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">What these specs mean for you</h2>

        {laptop.gpu_type === 'dedicated' && laptop.gpu_tgp_watts > 0 && (
          <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
            <p className="font-semibold text-sm mb-1">GPU: {laptop.gpu_model} at {laptop.gpu_tgp_watts}W TGP</p>
            <p className="text-sm text-muted-foreground">
              TGP (Total Graphics Power) is the actual wattage your GPU runs at. The same RTX 4060 at 80W
              is 40% faster than at 50W. {laptop.gpu_tgp_watts >= 80 ? `This laptop's ${laptop.gpu_tgp_watts}W is on the higher end — good for serious gaming and video rendering.` : `At ${laptop.gpu_tgp_watts}W, this is a power-efficient variant — great for battery, lighter for heavy rendering tasks.`}
            </p>
          </div>
        )}

        {laptop.ram_gb <= 8 && (
          <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4">
            <p className="font-semibold text-sm mb-1 text-orange-400">⚠ 8GB RAM Warning</p>
            <p className="text-sm text-muted-foreground">
              8GB is the absolute minimum for modern Windows laptops. You will notice slowdowns
              with 15+ browser tabs, running background apps, or any creative software. If possible,
              choose a 16GB variant or upgrade before purchasing.
            </p>
          </div>
        )}

        <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
          <p className="font-semibold text-sm mb-1">Display: {laptop.display_size}" {laptop.display_type} at {laptop.display_hz}Hz</p>
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

      {/* Get personalised recommendation CTA */}
      <div className="rounded-xl bg-blue-600/10 border border-blue-500/30 p-6 text-center space-y-3">
        <p className="font-semibold">Not sure if this is right for you?</p>
        <p className="text-sm text-muted-foreground">
          Answer 5 questions and get a personalised ranking with expert explanations — free.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Get My Personalised Recommendation →
        </Link>
      </div>
    </article>
    </>
  )
}
