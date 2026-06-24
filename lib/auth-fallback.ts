import { SupabaseClient } from '@supabase/supabase-js'

export async function getFallbackAdmins(supabase: SupabaseClient): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('content_html')
      .eq('slug', 'system-authorized-admin-emails')
      .maybeSingle()
      
    if (error || !data) return []
    return JSON.parse(data.content_html)
  } catch (err) {
    console.error('Failed to get fallback admins:', err)
    return []
  }
}

export async function saveFallbackAdmins(supabase: SupabaseClient, emails: string[]): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('blog_posts')
      .upsert({
        slug: 'system-authorized-admin-emails',
        title: 'System Authorized Admin Emails',
        meta_description: 'Internal system storage for authorized admin emails. Do not delete.',
        content_html: JSON.stringify(emails),
        target_keyword: 'system',
        published: false
      }, { onConflict: 'slug' })
      
    return !error
  } catch (err) {
    console.error('Failed to save fallback admins:', err)
    return false
  }
}
