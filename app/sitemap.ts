import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { SITE_URL } from '@/lib/site'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sitemapEntries: MetadataRoute.Sitemap = []
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabase = supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null

  // Static pages with high priority
  sitemapEntries.push(
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7
    },
    {
      url: `${SITE_URL}/laptops`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8
    },
    {
      url: `${SITE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8
    }
  )

  // Fetch all active laptops
  if (supabase) {
    try {
    const { data: laptops } = await supabase
      .from('laptops')
      .select('slug, last_updated')
      .eq('is_active', true)
      .order('last_updated', { ascending: false })

    if (laptops) {
      laptops.forEach(laptop => {
        sitemapEntries.push({
          url: `${SITE_URL}/laptops/${laptop.slug}`,
          lastModified: new Date(laptop.last_updated),
          changeFrequency: 'monthly',
          priority: 0.8
        })
      })
    }
    } catch (error) {
      console.error('Error fetching laptops for sitemap:', error)
    }
  }

  // Fetch all published blog posts
  if (supabase) {
    try {
    const { data: blogs } = await supabase
      .from('blog_posts')
      .select('slug, created_at, updated_at, published')
      .eq('published', true)
      .order('updated_at', { ascending: false })

    if (blogs) {
      blogs.forEach(blog => {
        sitemapEntries.push({
          url: `${SITE_URL}/blog/${blog.slug}`,
          lastModified: new Date(blog.updated_at || blog.created_at),
          changeFrequency: 'weekly',
          priority: 0.9
        })
      })
    }
    } catch (error) {
      console.error('Error fetching blog posts for sitemap:', error)
    }
  }

  // Category pages for use-cases
  const useCases = ['students', 'programming', 'gaming', 'video-editing', 'ai-ml', 'design', 'business', 'content']
  useCases.forEach(useCase => {
    sitemapEntries.push({
      url: `${SITE_URL}/laptops?best_for=${useCase}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7
    })
  })

  // Budget category pages
  const budgets = ['budget-30k', 'budget-50k', 'budget-50k-1l', 'budget-1l-2l', 'budget-2l-plus']
  budgets.forEach(budget => {
    sitemapEntries.push({
      url: `${SITE_URL}/laptops?budget=${budget}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7
    })
  })

  return sitemapEntries
}
