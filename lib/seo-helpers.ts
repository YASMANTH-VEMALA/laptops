// SEO helper functions
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/--+/g, '-')
    .slice(0, 100) // Max slug length
}

export function generateProductSchema(laptop: {
  name: string
  brand: string
  price_inr: number
  image_url?: string | null
  pros?: string | null
  affiliate_amazon_in?: string | null
  slug: string
}) {
  return {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: laptop.name,
    image: laptop.image_url || 'https://laptick.in/api/og/laptop/' + laptop.slug,
    description: laptop.pros?.substring(0, 200) || `High-performance ${laptop.brand} laptop`,
    brand: {
      '@type': 'Brand',
      name: laptop.brand
    },
    price: laptop.price_inr,
    priceCurrency: 'INR',
    availability: 'https://schema.org/InStock',
    offers: laptop.affiliate_amazon_in
      ? {
          '@type': 'Offer',
          url: laptop.affiliate_amazon_in,
          priceCurrency: 'INR',
          price: laptop.price_inr,
          availability: 'https://schema.org/InStock',
          seller: {
            '@type': 'Organization',
            name: 'Amazon India'
          }
        }
      : undefined
  }
}

export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  }
}

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Laptop Advisor',
    url: 'https://laptick.in',
    logo: 'https://laptick.in/logo.png',
    description: "India's most trusted AI-powered laptop recommendation engine",
    sameAs: [
      'https://twitter.com/laptickadvisor',
      'https://linkedin.com/company/laptop-advisor'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'support@laptick.in'
    }
  }
}

export function generateBlogPostingSchema(blog: {
  title: string
  meta_description: string
  slug: string
  created_at: string
  updated_at: string
  content_html?: string
  image_url?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    description: blog.meta_description,
    image: blog.image_url || `https://laptick.in/api/og/blog/${blog.slug}`,
    datePublished: blog.created_at,
    dateModified: blog.updated_at,
    author: {
      '@type': 'Organization',
      name: 'Laptop Advisor'
    },
    articleBody: blog.content_html
      ? blog.content_html.replace(/<[^>]*>/g, '').substring(0, 1000)
      : 'Read the full article on Laptop Advisor'
  }
}

export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }
}
