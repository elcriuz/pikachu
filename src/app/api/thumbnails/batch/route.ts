import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { generateVideoThumbnail } from '@/lib/video'

export async function POST(request: NextRequest) {
  const user = await getSession(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { paths } = await request.json()

  if (!paths || !Array.isArray(paths)) {
    return NextResponse.json({ error: 'Paths array required' }, { status: 400 })
  }

  const results = await Promise.allSettled(
    paths.map(async (videoPath) => {
      try {
        const thumbnailPath = await generateVideoThumbnail(videoPath)
        return {
          videoPath,
          thumbnailPath,
          url: `/api/files/${thumbnailPath}`,
          success: true
        }
      } catch (error: any) {
        return {
          videoPath,
          error: error.message,
          success: false
        }
      }
    })
  )

  const thumbnails = results.map(result => 
    result.status === 'fulfilled' ? result.value : { success: false, error: 'Processing failed' }
  )

  return NextResponse.json({ thumbnails })
}