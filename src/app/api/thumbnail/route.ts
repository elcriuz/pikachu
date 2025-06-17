import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { generateVideoThumbnail } from '@/lib/video'

export async function GET(request: NextRequest) {
  const user = await getSession(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const videoPath = searchParams.get('path')
  const timestamp = searchParams.get('timestamp') || '00:00:01'

  if (!videoPath) {
    return NextResponse.json({ error: 'Video path required' }, { status: 400 })
  }

  try {
    const thumbnailPath = await generateVideoThumbnail(videoPath, timestamp)
    return NextResponse.json({ 
      success: true, 
      thumbnailPath,
      url: `/api/files/${thumbnailPath}`
    })
  } catch (error: any) {
    console.error('Thumbnail generation error:', error)
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getSession(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { path: videoPath, timestamp = '00:00:01' } = await request.json()

  if (!videoPath) {
    return NextResponse.json({ error: 'Video path required' }, { status: 400 })
  }

  try {
    const thumbnailPath = await generateVideoThumbnail(videoPath, timestamp)
    return NextResponse.json({ 
      success: true, 
      thumbnailPath,
      url: `/api/files/${thumbnailPath}`
    })
  } catch (error: any) {
    console.error('Thumbnail generation error:', error)
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}