import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { convertVideo, getVideoInfo } from '@/lib/video'
import { getMetadata, saveMetadata } from '@/lib/metadata'

// Store active conversions in memory (in production, use Redis or similar)
const activeConversions = new Map<string, { progress: number; status: string }>()

export async function POST(request: NextRequest) {
  const user = await getSession(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { path: videoPath } = await request.json()

  if (!videoPath) {
    return NextResponse.json({ error: 'No video path provided' }, { status: 400 })
  }

  // Check if conversion is already in progress
  if (activeConversions.has(videoPath)) {
    return NextResponse.json({ 
      error: 'Conversion already in progress',
      progress: activeConversions.get(videoPath)
    }, { status: 409 })
  }

  try {
    // Get video info first
    const videoInfo = await getVideoInfo(videoPath)
    const videoStream = videoInfo.streams.find((s: any) => s.codec_type === 'video')
    
    if (!videoStream) {
      return NextResponse.json({ error: 'No video stream found' }, { status: 400 })
    }

    // Start conversion
    activeConversions.set(videoPath, { progress: 0, status: 'starting' })

    // Run conversion in background
    convertVideo(videoPath, (progress) => {
      console.log('Conversion progress for', videoPath, ':', progress)
      activeConversions.set(videoPath, { 
        progress: progress.percent || 0, 
        status: 'converting' 
      })
    })
      .then(async (outputPath) => {
        console.log('Conversion completed:', outputPath)
        // Update metadata to include converted version
        const metadata = await getMetadata(videoPath)
        metadata.convertedPath = outputPath
        metadata.conversionDate = new Date().toISOString()
        await saveMetadata(videoPath, metadata, user)
        
        activeConversions.set(videoPath, { progress: 100, status: 'completed' })
        // Clean up after a delay
        setTimeout(() => activeConversions.delete(videoPath), 5000)
      })
      .catch((error) => {
        console.error('Conversion error:', error)
        activeConversions.set(videoPath, { 
          progress: 0, 
          status: `error: ${error.message}` 
        })
        // Clean up after a delay
        setTimeout(() => activeConversions.delete(videoPath), 30000)
      })

    return NextResponse.json({ 
      message: 'Conversion started',
      originalInfo: {
        codec: videoStream.codec_name,
        width: videoStream.width,
        height: videoStream.height,
        bitrate: videoStream.bit_rate,
        duration: videoInfo.format.duration
      }
    })
  } catch (error) {
    console.error('Error starting conversion:', error)
    return NextResponse.json({ error: 'Failed to start conversion' }, { status: 500 })
  }
}

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

  const conversion = activeConversions.get(path)
  
  if (!conversion) {
    // Check if converted version exists
    const metadata = await getMetadata(path)
    if (metadata.convertedPath) {
      return NextResponse.json({ 
        status: 'completed',
        convertedPath: metadata.convertedPath,
        conversionDate: metadata.conversionDate
      })
    }
    return NextResponse.json({ status: 'not_started' })
  }

  return NextResponse.json(conversion)
}