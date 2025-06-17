import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import fs from 'fs/promises'
import path from 'path'

const DATA_DIR = process.env.DATA_DIR || './data'

export async function GET(request: NextRequest) {
  const user = await getSession(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const dirPath = searchParams.get('path') || ''

  try {
    const fullPath = path.join(DATA_DIR, dirPath)
    const entries = await fs.readdir(fullPath, { withFileTypes: true })
    
    const files = entries
      .filter(entry => !entry.name.startsWith('.'))
      .map(entry => ({
        name: entry.name,
        isDirectory: entry.isDirectory(),
        path: path.join(dirPath, entry.name)
      }))
      .sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) {
          return a.isDirectory ? -1 : 1
        }
        return a.name.localeCompare(b.name)
      })

    return NextResponse.json({
      path: dirPath,
      files
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      path: dirPath 
    }, { status: 500 })
  }
}