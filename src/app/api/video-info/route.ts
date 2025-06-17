import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getVideoInfo } from '@/lib/video'

export async function GET(request: NextRequest) {
  const user = await getSession(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const path = searchParams.get('path')

  if (!path) {
    return NextResponse.json({ error: 'No path provided' }, { status: 400 })
  }

  try {
    const info = await getVideoInfo(path)
    
    // Extract relevant information
    const videoStream = info.streams.find((s: any) => s.codec_type === 'video')
    const audioStream = info.streams.find((s: any) => s.codec_type === 'audio')
    
    return NextResponse.json({
      format: info.format.format_name,
      duration: info.format.duration,
      size: info.format.size,
      bitrate: info.format.bit_rate,
      video: videoStream ? {
        codec: videoStream.codec_name,
        profile: videoStream.profile,
        pixelFormat: videoStream.pix_fmt,
        width: videoStream.width,
        height: videoStream.height,
        fps: eval(videoStream.r_frame_rate)
      } : null,
      audio: audioStream ? {
        codec: audioStream.codec_name,
        sampleRate: audioStream.sample_rate,
        channels: audioStream.channels,
        bitrate: audioStream.bit_rate
      } : null
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Failed to get video info',
      details: error.message 
    }, { status: 500 })
  }
}