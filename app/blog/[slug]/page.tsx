import { Metadata } from 'next'
import { getServiceClient } from '@/lib/supabase'
import { generateBlogPostingSchema } from '@/lib/seo-helpers'
import Link from 'next/link'

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
      authors: ['Laptop Advisor'],
      url: `https://laptick.com/blog/${post.slug}`,
      images: [
        {
          url: post.image_url || `https://laptick.com/api/og/blog/${post.slug}`,
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
      images: [post.image_url || `https://laptick.com/api/og/blog/${post.slug}`]
    }
  }
}

export async function generateStaticParams() {
  const { data: posts } = await getSupabase()
    .from('blog_posts')
    .select('slug')
    .eq('published', true)

  return (posts || []).map(post => ({
    slug: post.slug
  }))
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <article className="min-h-screen bg-white">
        {/* Header */}
        <header className="bg-gray-50 px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <Link href="/blog" className="hover:text-blue-600">
                Blog
              </Link>
              <span>/</span>
              <span>{post.title}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              {post.title}
            </h1>
            <p className="text-xl text-gray-600 mb-6">{post.meta_description}</p>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>
                Published{' '}
                {new Date(post.created_at).toLocaleDateString('en-IN')}
              </span>
              {post.updated_at !== post.created_at && (
                <span>
                  Updated {new Date(post.updated_at).toLocaleDateString('en-IN')}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-2xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content_html }}
          />

          {/* Featured Laptops */}
          {featuredLaptops.length > 0 && (
            <section className="mt-16 pt-16 border-t-2 border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">
                Featured Laptops
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featuredLaptops.map(laptop => (
                  <Link
                    key={laptop.id}
                    href={`/laptops/${laptop.slug}`}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-lg transition-all"
                  >
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {laptop.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">{laptop.brand}</p>
                    <p className="text-lg font-bold text-blue-600">
                      ₹{laptop.price_inr.toLocaleString('en-IN')}
                    </p>
                    {laptop.affiliate_amazon_in && (
                      <a
                        href={laptop.affiliate_amazon_in}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-3 text-sm text-white bg-orange-500 hover:bg-orange-600 px-3 py-1 rounded"
                        onClick={() => {
                          if (typeof window !== 'undefined' && window.gtag) {
                            window.gtag.event('affiliate_click', {
                              event_category: 'monetization',
                              event_label: laptop.id,
                              laptop_name: laptop.name,
                              source: 'blog'
                            })
                          }
                        }}
                      >
                        Check Price →
                      </a>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section className="mt-16 pt-16 border-t-2 border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">
                Related Articles
              </h2>
              <div className="space-y-4">
                {relatedPosts.map(relatedPost => (
                  <Link
                    key={relatedPost.slug}
                    href={`/blog/${relatedPost.slug}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
                  >
                    <h3 className="font-semibold text-gray-900 hover:text-blue-600">
                      {relatedPost.title} →
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {relatedPost.meta_description}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* CTA */}
          <section className="mt-16 pt-16 border-t-2 border-gray-200">
            <div className="bg-blue-50 rounded-lg p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Ready for a Personalized Recommendation?
              </h2>
              <p className="text-gray-700 mb-6">
                Answer a few quick questions and get your perfect laptop match.
              </p>
              <Link
                href="/recommend"
                className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
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
