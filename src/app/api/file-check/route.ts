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
  const filePath = searchParams.get('path') || ''

  try {
    const fullPath = path.join(DATA_DIR, filePath)
    
    try {
      const stats = await fs.stat(fullPath)
      return NextResponse.json({
        exists: true,
        path: filePath,
        size: stats.size,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory()
      })
    } catch {
      return NextResponse.json({
        exists: false,
        path: filePath
      })
    }
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}