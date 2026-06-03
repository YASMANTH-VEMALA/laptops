// Analytics event tracking functions
// These use gtag (Google Analytics 4) which is loaded via @next/third-parties/google

declare global {
  interface Window {
    gtag: {
      event: (name: string, params: Record<string, unknown>) => void
      config: (id: string, config: Record<string, unknown>) => void
    }
  }
}

export function trackRecommendationRequest(formInputs: {
  role?: string
  primary_use?: string
  budget_key?: string
  os_preference?: string
}) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag.event('recommendation_request', {
      event_category: 'engagement',
      event_label: `${formInputs.primary_use}-${formInputs.budget_key}`,
      user_role: formInputs.role,
      primary_use: formInputs.primary_use,
      budget_key: formInputs.budget_key,
      os_preference: formInputs.os_preference,
      timestamp: new Date().toISOString()
    })
  }
}

export function trackResultClick(
  laptopId: string,
  laptopName: string,
  position: 1 | 2 | 3
) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag.event('result_click', {
      event_category: 'engagement',
      event_label: laptopId,
      laptop_name: laptopName,
      position: position,
      timestamp: new Date().toISOString()
    })
  }
}

export function trackAffiliateClick(
  asin: string,
  laptopName: string,
  source: 'recommendation' | 'blog' | 'detail_page'
) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag.event('affiliate_click', {
      event_category: 'monetization',
      event_label: asin,
      laptop_name: laptopName,
      source: source,
      timestamp: new Date().toISOString(),
      value: 1 // Affiliate click counts as 1 conversion unit
    })
  }
}

export function trackBlogView(slug: string, title: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag.event('blog_view', {
      event_category: 'content',
      event_label: slug,
      blog_title: title,
      timestamp: new Date().toISOString()
    })
  }
}

export function trackTimeOnPage(slug: string, timeInSeconds: number) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag.event('page_engagement', {
      event_category: 'content',
      event_label: slug,
      time_on_page: Math.round(timeInSeconds),
      timestamp: new Date().toISOString()
    })
  }
}

export function trackInternalLinkClick(linkUrl: string, linkText: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag.event('internal_link_click', {
      event_category: 'engagement',
      event_label: linkUrl,
      link_text: linkText,
      timestamp: new Date().toISOString()
    })
  }
}

export function trackBudgetFilter(budgetKey: string, resultsCount: number) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag.event('budget_filter', {
      event_category: 'engagement',
      event_label: budgetKey,
      results_count: resultsCount,
      timestamp: new Date().toISOString()
    })
  }
}

export function trackUseCaseFilter(useCase: string, resultsCount: number) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag.event('usecase_filter', {
      event_category: 'engagement',
      event_label: useCase,
      results_count: resultsCount,
      timestamp: new Date().toISOString()
    })
  }
}
