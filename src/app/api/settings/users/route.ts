import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import fs from 'fs/promises'
import path from 'path'
import type { User } from '@/types'

interface UsersConfig {
  users: User[]
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const configPath = path.join(process.cwd(), 'config', 'users.json')
    const data = await fs.readFile(configPath, 'utf-8')
    const config: UsersConfig = JSON.parse(data)

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error reading users:', error)
    return NextResponse.json({ error: 'Failed to read users' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, userData, originalEmail, email } = body

    const configPath = path.join(process.cwd(), 'config', 'users.json')
    const data = await fs.readFile(configPath, 'utf-8')
    const config: UsersConfig = JSON.parse(data)

    switch (action) {
      case 'create':
        if (config.users.some(u => u.email === userData.email)) {
          return NextResponse.json({ error: 'User already exists' }, { status: 400 })
        }
        config.users.push(userData)
        break

      case 'update':
        const userIndex = config.users.findIndex(u => u.email === originalEmail)
        if (userIndex === -1) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }
        config.users[userIndex] = userData
        break

      case 'delete':
        config.users = config.users.filter(u => u.email !== email)
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    await fs.writeFile(configPath, JSON.stringify(config, null, 2))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error managing users:', error)
    return NextResponse.json({ error: 'Failed to manage users' }, { status: 500 })
  }
}