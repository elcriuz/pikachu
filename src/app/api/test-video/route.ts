import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

const DATA_DIR = process.env.DATA_DIR || './data'

export async function GET(request: NextRequest) {
  const user = await getSession(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Test with a specific video file
    const videoPath = 'Example Client/Demo Project/Casting/Liam_AnnyTalents/Liam_AnnyTalents_Intro_web.mp4'
    const fullPath = path.join(DATA_DIR, videoPath)
    
    console.log('[TEST] Video path:', fullPath)
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      console.error('[TEST] File not found:', fullPath)
      return NextResponse.json({ error: 'File not found', path: fullPath }, { status: 404 })
    }
    
    const stat = fs.statSync(fullPath)
    const fileSize = stat.size
    const range = request.headers.get('range')
    
    console.log('[TEST] File size:', fileSize, 'Range:', range)
    
    if (range) {
      // Parse Range header
      const parts = range.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
      const chunksize = (end - start) + 1
      
      const stream = fs.createReadStream(fullPath, { start, end })
      const headers = new Headers({
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize.toString(),
        'Content-Type': 'video/mp4',
      })
      
      // @ts-ignore - ReadableStream typing issue
      return new NextResponse(stream as any, {
        status: 206,
        headers,
      })
    } else {
      // No range request, send entire file
      const stream = fs.createReadStream(fullPath)
      const headers = new Headers({
        'Content-Length': fileSize.toString(),
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes',
      })
      
      // @ts-ignore - ReadableStream typing issue
      return new NextResponse(stream as any, {
        status: 200,
        headers,
      })
    }
  } catch (error: any) {
    console.error('[TEST] Error:', error)
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}