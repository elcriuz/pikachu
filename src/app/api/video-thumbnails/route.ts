import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { generateVideoThumbnails } from '@/lib/video'

export async function GET(request: NextRequest) {
  const user = await getSession(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const videoPath = searchParams.get('path')

  if (!videoPath) {
    return NextResponse.json({ error: 'Video path required' }, { status: 400 })
  }

  try {
    const { vttPath } = await generateVideoThumbnails(videoPath)
    return NextResponse.json({ 
      success: true, 
      vttPath,
      vttUrl: `/api/files/${vttPath}`
    })
  } catch (error: any) {
    console.error('Video thumbnails error:', error)
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

  const { path: videoPath, interval = 10 } = await request.json()

  if (!videoPath) {
    return NextResponse.json({ error: 'Video path required' }, { status: 400 })
  }

  try {
    const { vttPath } = await generateVideoThumbnails(videoPath, interval)
    return NextResponse.json({ 
      success: true, 
      vttPath,
      vttUrl: `/api/files/${vttPath}`
    })
  } catch (error: any) {
    console.error('Video thumbnails error:', error)
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}