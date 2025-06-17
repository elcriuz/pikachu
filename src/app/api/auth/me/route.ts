import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET() {
  console.log('GET /api/auth/me called')
  const user = await getSession()
  console.log('Session user:', user)
  
  if (!user) {
    console.error('No user in session')
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  return NextResponse.json({ user })
}