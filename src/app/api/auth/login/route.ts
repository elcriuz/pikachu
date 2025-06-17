import { NextRequest, NextResponse } from 'next/server'
import { validateUser, createToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const { email } = await request.json()
  console.log('Login attempt for email:', email)

  const user = await validateUser(email)
  console.log('User found:', user)
  
  if (!user) {
    console.error('User not found for email:', email)
    return NextResponse.json(
      { error: 'Benutzer nicht gefunden' },
      { status: 401 }
    )
  }

  const token = await createToken(user)
  
  console.log('Setting cookie, NODE_ENV:', process.env.NODE_ENV)
  cookies().set('auth-token', token, {
    httpOnly: true,
    secure: false, // Always set to false for development
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  })

  return NextResponse.json({ user })
}