import { Metadata } from 'next'
import { getServiceClient } from '@/lib/supabase'
import { generateBlogPostingSchema } from '@/lib/seo-helpers'
import Link from 'next/link'
import { absoluteUrl } from '@/lib/site'

const getSupabase = () => getServiceClient()

interface BlogPost {
  slug: string
  title: string
  meta_description: string
  target_keyword: string
  content_html: string
  featured_laptop_ids: string[]
  created_at: string
  updated_at: string
  published: boolean
  image_url?: string
}

interface Laptop {
  id: string
  slug: string
  name: string
  price_inr: number
  brand: string
  affiliate_amazon_in?: string
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const { data: post } = await getSupabase()
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!post) {
    return {
      title: 'Blog Post Not Found',
      robots: { index: false }
    }
  }

  return {
    title: post.title,
    description: post.meta_description,
    keywords: [post.target_keyword, 'laptop', 'india', 'recommendation'],
    openGraph: {
      title: post.title,
      description: post.meta_description,
      type: 'article',
      publishedTime: post.created_at,
      modifiedTime: post.updated_at,
      authors: ['Laptick'],
      url: absoluteUrl(`/blog/${post.slug}`),
      images: [
        {
          url: post.image_url || absoluteUrl(`/api/og/blog/${post.slug}`),
          width: 1200,
          height: 630,
          alt: post.title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.meta_description,
      images: [post.image_url || absoluteUrl(`/api/og/blog/${post.slug}`)]
    }
  }
}

export async function generateStaticParams() {
  try {
    const { data: posts } = await getSupabase()
      .from('blog_posts')
      .select('slug')
      .eq('published', true)

    return (posts || []).map(post => ({
      slug: post.slug
    }))
  } catch (error) {
    console.warn('Skipping blog static params; Supabase env vars are not configured.', error)
    return []
  }
}

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const { data } = await getSupabase()
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  return data
}

async function getFeaturedLaptops(laptopIds: string[]): Promise<Laptop[]> {
  if (!laptopIds || laptopIds.length === 0) return []

  const { data } = await getSupabase()
    .from('laptops')
    .select('id, slug, name, price_inr, brand, affiliate_amazon_in')
    .in('id', laptopIds)
    .eq('is_active', true)

  return data || []
}

async function getRelatedBlogPosts(
  currentSlug: string,
  limit: number = 3
): Promise<BlogPost[]> {
  const { data } = await getSupabase()
    .from('blog_posts')
    .select('*')
    .eq('published', true)
    .neq('slug', currentSlug)
    .order('created_at', { ascending: false })
    .limit(limit)

  return data || []
}

export default async function BlogPostPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getBlogPost(slug)

  if (!post) {
    return (
      <div className="min-h-screen bg-white px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900">Post Not Found</h1>
          <p className="mt-4 text-gray-600">
            Sorry, we couldn&apos;t find this blog post.
          </p>
          <Link href="/blog" className="mt-8 text-blue-600 hover:text-blue-800">
            ← Back to Blog
          </Link>
        </div>
      </div>
    )
  }

  const featuredLaptops = await getFeaturedLaptops(post.featured_laptop_ids)
  const relatedPosts = await getRelatedBlogPosts(post.slug)

  const schema = generateBlogPostingSchema({
    title: post.title,
    meta_description: post.meta_description,
    slug: post.slug,
    created_at: post.created_at,
    updated_at: post.updated_at,
    content_html: post.content_html,
    image_url: post.image_url
  })

  return (
    <>
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
      />

      <article className="laptick-themed-page min-h-screen">
        {/* Header */}
        <header className="px-4 py-12 sm:px-6 lg:px-8 border-b-2 border-foreground/10">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Link href="/blog" className="hover:text-primary font-bold transition-colors">
                Blog
              </Link>
              <span>/</span>
              <span className="truncate">{post.title}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-foreground mb-4 leading-tight">
              {post.title}
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-6 font-semibold leading-relaxed">{post.meta_description}</p>
            <div className="flex flex-wrap gap-4 text-xs font-mono text-muted-foreground uppercase tracking-wider">
              <span>
                Published{' '}
                {new Date(post.created_at).toLocaleDateString('en-IN')}
              </span>
              {post.updated_at !== post.created_at && (
                <span>
                  · Updated {new Date(post.updated_at).toLocaleDateString('en-IN')}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-2xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div
            className="prose prose-lg max-w-none dark:prose-invert text-foreground prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground prose-ul:text-foreground/90 prose-ol:text-foreground/90 prose-li:text-foreground/90"
            dangerouslySetInnerHTML={{ __html: post.content_html }}
          />

          {/* Featured Laptops */}
          {featuredLaptops.length > 0 && (
            <section className="mt-16 pt-16 border-t-2 border-foreground/15">
              <h2 className="text-3xl font-black text-foreground mb-8 font-display">
                Featured Laptops
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featuredLaptops.map(laptop => (
                  <Link
                    key={laptop.id}
                    href={`/laptops/${laptop.slug}`}
                    className="p-5 border-2 border-foreground bg-background shadow-[4px_4px_0_var(--foreground)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--foreground)] transition-all block"
                  >
                    <h3 className="font-black text-foreground mb-2 leading-tight">
                      {laptop.name}
                    </h3>
                    <p className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">{laptop.brand}</p>
                    <p className="text-xl font-black text-accent">
                      ₹{laptop.price_inr.toLocaleString('en-IN')}
                    </p>
                    {laptop.affiliate_amazon_in && (
                      <span className="inline-block mt-4 text-xs font-black uppercase bg-primary border-2 border-foreground px-3.5 py-1.5 shadow-[2px_2px_0_var(--foreground)] text-foreground">
                        Buy on Amazon
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section className="mt-16 pt-16 border-t-2 border-foreground/15">
              <h2 className="text-3xl font-black text-foreground mb-8 font-display">
                Related Articles
              </h2>
              <div className="space-y-4">
                {relatedPosts.map(relatedPost => (
                  <Link
                    key={relatedPost.slug}
                    href={`/blog/${relatedPost.slug}`}
                    className="block p-5 border-2 border-foreground bg-background shadow-[4px_4px_0_var(--foreground)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--foreground)] transition-all"
                  >
                    <h3 className="font-black text-lg text-foreground hover:text-primary leading-snug">
                      {relatedPost.title} →
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2 font-medium">
                      {relatedPost.meta_description}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* CTA */}
          <section className="mt-16 pt-16 border-t-2 border-foreground/15">
            <div className="themed-card text-center" style={{ background: '#d9ff3f' }}>
              <h2 className="text-2xl font-black text-foreground mb-3 font-display">
                Ready for a Personalized Recommendation?
              </h2>
              <p className="text-foreground/90 mb-5 font-semibold text-sm">
                Answer a few quick questions and get your perfect laptop match.
              </p>
              <Link
                href="/find-my-laptop"
                className="themed-primary-action inline-block"
                style={{ background: 'hsl(0 0% 2%)', color: '#d9ff3f', width: 'auto', paddingInline: '2rem' }}
              >
                Get Recommendation →
              </Link>
            </div>
          </section>
        </main>
      </article>
    </>
  )
}
