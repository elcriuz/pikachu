import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

const DATA_DIR = process.env.DATA_DIR || './data'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const user = await getSession(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const filePath = params.path.join('/')
    const fullPath = path.join(process.cwd(), DATA_DIR, filePath)
    
    console.log('[API] Serving file:', filePath)
    console.log('[API] Full path:', fullPath)
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      console.error('[API] File not found:', fullPath)
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
    
    const stat = fs.statSync(fullPath)
    const fileSize = stat.size
    const ext = path.extname(filePath).toLowerCase()
    const contentType = getContentType(ext)
    
    console.log('[API] File size:', fileSize, 'Content-Type:', contentType)
    
    // For video files, handle range requests
    const range = request.headers.get('range')
    if (range && contentType.startsWith('video/')) {
      const parts = range.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
      const chunksize = (end - start) + 1
      
      console.log('[API] Range request:', start, '-', end, 'chunk size:', chunksize)
      
      // Read only the requested chunk
      const buffer = Buffer.alloc(chunksize)
      const fd = fs.openSync(fullPath, 'r')
      fs.readSync(fd, buffer, 0, chunksize, start)
      fs.closeSync(fd)
      
      return new NextResponse(buffer, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize.toString(),
          'Content-Type': contentType,
        },
      })
    }
    
    // For non-range requests or non-video files, send the whole file
    const buffer = fs.readFileSync(fullPath)
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Accept-Ranges': 'bytes',
        'Content-Length': fileSize.toString(),
      },
    })
  } catch (error) {
    console.error('[API] Error serving file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getContentType(ext: string): string {
  const types: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.webm': 'video/webm',
    '.pdf': 'application/pdf',
  }
  return types[ext] || 'application/octet-stream'
}