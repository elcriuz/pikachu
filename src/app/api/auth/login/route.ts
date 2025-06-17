import { NextRequest, NextResponse } from 'next/server'
import { validateUser, createToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const { email } = await request.json()

  const user = await validateUser(email)
  if (!user) {
    return NextResponse.json(
      { error: 'Benutzer nicht gefunden' },
      { status: 401 }
    )
  }

  const token = await createToken(user)
  
  cookies().set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  return NextResponse.json({ user })
}