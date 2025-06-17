import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  // Delete cookie with same settings as when it was created
  cookies().set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // Expire immediately
  })
  
  return NextResponse.json({ success: true })
}