import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import fs from 'fs/promises'

const DATA_DIR = process.env.DATA_DIR || './data'

// Set ffmpeg paths
ffmpeg.setFfmpegPath('/opt/homebrew/bin/ffmpeg')
ffmpeg.setFfprobePath('/opt/homebrew/bin/ffprobe')

export async function POST(request: NextRequest) {
  const user = await getSession(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { path: videoPath } = await request.json()
  
  try {
    const fullInputPath = path.join(DATA_DIR, videoPath)
    
    // Create a web-compatible version with a different suffix
    const baseName = path.basename(videoPath).replace(/_converted\.mp4$/, '')
    const outputFileName = baseName + '_web.mp4'
    const outputDir = path.dirname(videoPath)
    const outputPath = path.join(DATA_DIR, outputDir, outputFileName)
    
    await new Promise((resolve, reject) => {
      ffmpeg(fullInputPath)
        .outputOptions([
          '-c:v libx264',
          '-profile:v baseline',
          '-level 3.0',
          '-pix_fmt yuv420p',
          '-preset fast',
          '-crf 23',
          '-c:a aac',
          '-strict -2',
          '-ar 44100',
          '-ac 2',
          '-b:a 128k',
          '-movflags +faststart'
        ])
        .output(outputPath)
        .on('start', (cmd) => console.log('Force conversion:', cmd))
        .on('end', resolve)
        .on('error', reject)
        .run()
    })
    
    return NextResponse.json({ 
      success: true, 
      outputPath: path.join(outputDir, outputFileName)
    })
  } catch (error: any) {
    console.error('Force conversion error:', error)
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}