import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

const RAINFOREST_ENDPOINT = 'https://api.rainforestapi.com/request'

export async function GET(request: NextRequest) {
  const apiKey = process.env.RAINFOREST_API_KEY

  if (!apiKey) {
    return Response.json(
      { error: 'RAINFOREST_API_KEY is not configured on the server.' },
      { status: 500 }
    )
  }

  const searchTerm = request.nextUrl.searchParams.get('q')?.trim()

  if (!searchTerm) {
    return Response.json({ error: 'Missing required query parameter: q' }, { status: 400 })
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    type: 'search',
    amazon_domain: request.nextUrl.searchParams.get('amazon_domain') || 'amazon.in',
    search_term: searchTerm,
  })

  const response = await fetch(`${RAINFOREST_ENDPOINT}?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  })

  const data = await response.json()

  if (!response.ok) {
    return Response.json(
      { error: 'Rainforest request failed.', details: data },
      { status: response.status }
    )
  }

  return Response.json(data)
}
