import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  return NextResponse.json({ error: 'Credential login is disabled. Please use Google Sign In.' }, { status: 401 })
}
