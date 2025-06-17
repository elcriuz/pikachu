import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import type { User } from '@/types'

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'your-secret-key-here'
)

export async function getUsers(): Promise<User[]> {
  try {
    const configPath = path.join(process.cwd(), 'config', 'users.json')
    console.log('Reading users from:', configPath)
    const data = await fs.readFile(configPath, 'utf-8')
    const config = JSON.parse(data)
    console.log('Loaded users:', config.users)
    return config.users || []
  } catch (error) {
    console.error('Error reading users config:', error)
    return []
  }
}

export async function validateUser(email: string): Promise<User | null> {
  const users = await getUsers()
  return users.find(u => u.email === email) || null
}

export async function createToken(user: User): Promise<string> {
  return await new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyToken(token: string): Promise<User | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as User
  } catch (error) {
    return null
  }
}

export async function getSession(request?: NextRequest): Promise<User | null> {
  const cookieStore = request ? request.cookies : cookies()
  const token = cookieStore.get('auth-token')?.value
  console.log('getSession - token exists:', !!token)

  if (!token) {
    console.log('No auth-token cookie found')
    return null
  }

  const user = await verifyToken(token)
  console.log('getSession - verified user:', user)
  return user
}