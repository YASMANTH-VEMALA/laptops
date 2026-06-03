import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export const runtime = 'nodejs'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  try {
    const { data: laptop } = await supabase
      .from('laptops')
      .select('name, brand, price_inr, image_url')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (!laptop) {
      return new Response('Laptop not found', { status: 404 })
    }

    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 128,
            background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            color: 'white',
            fontFamily: 'system-ui'
          }}
        >
          {/* Logo/Branding */}
          <div
            style={{
              fontSize: 32,
              marginBottom: '20px',
              color: '#3b82f6',
              fontWeight: 'bold'
            }}
          >
            Laptop Advisor
          </div>

          {/* Laptop Name */}
          <div
            style={{
              fontSize: 64,
              fontWeight: 'bold',
              marginBottom: '20px',
              textAlign: 'center'
            }}
          >
            {laptop.name}
          </div>

          {/* Brand & Price */}
          <div
            style={{
              display: 'flex',
              gap: '40px',
              alignItems: 'center',
              marginBottom: '20px'
            }}
          >
            <div
              style={{
                fontSize: 40,
                color: '#9ca3af'
              }}
            >
              {laptop.brand}
            </div>
            <div
              style={{
                fontSize: 48,
                color: '#10b981',
                fontWeight: 'bold'
              }}
            >
              ₹{(laptop.price_inr / 100000).toFixed(1)}L
            </div>
          </div>

          {/* CTA Text */}
          <div
            style={{
              fontSize: 28,
              color: '#6b7280',
              marginTop: '20px'
            }}
          >
            Find your perfect laptop →
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate'
        }
      }
    )
  } catch (error) {
    console.error('OG image generation error:', error)
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 128,
            background: '#000',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff'
          }}
        >
          Laptop Advisor
        </div>
      ),
      {
        width: 1200,
        height: 630
      }
    )
  }
}
