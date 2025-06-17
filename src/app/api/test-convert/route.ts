import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import fs from 'fs/promises'

const DATA_DIR = process.env.DATA_DIR || './data'

export async function POST(request: NextRequest) {
  const user = await getSession(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { path: videoPath } = await request.json()
  
  try {
    const fullInputPath = path.join(DATA_DIR, videoPath)
    const outputPath = fullInputPath.replace(/\.[^.]+$/, '_test.mp4')
    
    // Check if file exists
    await fs.access(fullInputPath)
    
    // Simple conversion command
    await new Promise((resolve, reject) => {
      ffmpeg(fullInputPath)
        .output(outputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .on('end', resolve)
        .on('error', reject)
        .on('start', (cmd) => console.log('Test conversion:', cmd))
        .run()
    })
    
    return NextResponse.json({ 
      success: true, 
      outputPath: outputPath.replace(DATA_DIR + '/', '') 
    })
  } catch (error: any) {
    console.error('Test conversion error:', error)
    return NextResponse.json({ 
      error: error.message,
      details: error.toString()
    }, { status: 500 })
  }
}