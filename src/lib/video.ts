import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import fs from 'fs/promises'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const DATA_DIR = process.env.DATA_DIR || './data'

// Try to find ffmpeg in common locations
const possiblePaths = [
  '/usr/local/bin/ffmpeg',
  '/usr/bin/ffmpeg',
  '/opt/homebrew/bin/ffmpeg',
  'ffmpeg' // Use system PATH
]

async function findFFmpeg(): Promise<string | null> {
  for (const ffmpegPath of possiblePaths) {
    try {
      await execAsync(`${ffmpegPath} -version`)
      return ffmpegPath
    } catch {
      continue
    }
  }
  return null
}

// Set ffmpeg path
ffmpeg.setFfmpegPath('/opt/homebrew/bin/ffmpeg')
ffmpeg.setFfprobePath('/opt/homebrew/bin/ffprobe')
console.log('Using ffmpeg at: /opt/homebrew/bin/ffmpeg')

interface ConversionProgress {
  percent: number
  currentFps?: number
  currentKbps?: number
  targetSize?: string
  timemark?: string
}

export async function convertVideo(
  inputPath: string,
  onProgress?: (progress: ConversionProgress) => void
): Promise<string> {
  // Check if already converted
  if (inputPath.includes('_converted')) {
    console.log('File already converted, returning original path')
    return inputPath
  }
  
  const fullInputPath = path.join(DATA_DIR, inputPath)
  const baseName = path.basename(inputPath, path.extname(inputPath))
  const outputFileName = baseName + '_converted.mp4'
  const outputDir = path.dirname(inputPath)
  const outputPath = path.join(outputDir, outputFileName)
  const fullOutputPath = path.join(DATA_DIR, outputPath)

  // Check if converted version already exists
  try {
    await fs.access(fullOutputPath)
    return outputPath
  } catch {
    // File doesn't exist, proceed with conversion
  }

  // Ensure output directory exists
  await fs.mkdir(path.dirname(fullOutputPath), { recursive: true })

  return new Promise((resolve, reject) => {
    console.log('Starting conversion:', fullInputPath, '->', fullOutputPath)
    
    const command = ffmpeg(fullInputPath)
      .outputOptions([
        '-c:v libx264',                    // H.264 video codec
        '-profile:v baseline',             // Baseline profile for max compatibility
        '-level 3.1',                      // H.264 level for compatibility
        '-pix_fmt yuv420p',               // Pixel format for compatibility
        '-preset fast',                    // Balance speed and compression
        '-crf 23',                        // Quality setting
        '-maxrate 10M',                   // Max bitrate 10 Mbps
        '-bufsize 10M',                   // Buffer size
        '-vf scale=w=1920:h=1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,format=yuv420p', // Scale and pad to 1080p
        '-c:a aac',                       // AAC audio codec
        '-ar 48000',                      // Audio sample rate
        '-ac 2',                          // Stereo audio
        '-b:a 192k',                      // Audio bitrate
        '-movflags +faststart',           // Enable streaming
        '-f mp4'                          // Force MP4 format
      ])
      .output(fullOutputPath)
      .on('start', (commandLine) => {
        console.log('Spawned FFmpeg with command: ' + commandLine)
      })
      .on('progress', (progress) => {
        console.log('Progress:', progress)
        if (onProgress && progress.percent) {
          onProgress({
            percent: progress.percent,
            currentFps: progress.currentFps,
            currentKbps: progress.currentKbps,
            targetSize: progress.targetSize,
            timemark: progress.timemark
          })
        }
      })
      .on('end', () => {
        console.log('Conversion completed:', outputPath)
        resolve(outputPath)
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err)
        reject(err)
      })
      
    command.run()
  })
}

export async function getVideoInfo(videoPath: string): Promise<any> {
  const fullPath = path.join(DATA_DIR, videoPath)
  
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(fullPath, (err, metadata) => {
      if (err) {
        reject(err)
      } else {
        resolve(metadata)
      }
    })
  })
}

export function isVideoPlayable(mimeType: string): boolean {
  // Check if the video format is natively playable in browsers
  const playableFormats = [
    'video/mp4',
    'video/webm',
    'video/ogg'
  ]
  return playableFormats.includes(mimeType)
}

export async function validateConvertedVideo(videoPath: string): Promise<boolean> {
  try {
    const metadata = await getVideoInfo(videoPath)
    const videoStream = metadata.streams.find((s: any) => s.codec_type === 'video')
    const audioStream = metadata.streams.find((s: any) => s.codec_type === 'audio')
    
    // Check if it has H.264 video and AAC audio
    return videoStream?.codec_name === 'h264' && 
           (!audioStream || audioStream.codec_name === 'aac')
  } catch (error) {
    console.error('Error validating video:', error)
    return false
  }
}

export async function generateVideoThumbnails(
  videoPath: string,
  interval: number = 10 // Generate thumbnail every 10 seconds
): Promise<{ thumbnailsPath: string; vttPath: string }> {
  const fullInputPath = path.join(DATA_DIR, videoPath)
  const baseName = path.basename(videoPath, path.extname(videoPath))
  const outputDir = path.dirname(videoPath)
  const thumbnailsDir = path.join(DATA_DIR, outputDir, `${baseName}_thumbnails`)
  const vttPath = path.join(outputDir, `${baseName}_thumbnails.vtt`)
  const fullVttPath = path.join(DATA_DIR, vttPath)

  // Check if thumbnails already exist
  try {
    await fs.access(fullVttPath)
    console.log('Thumbnails already exist:', vttPath)
    return { thumbnailsPath: `${outputDir}/${baseName}_thumbnails`, vttPath }
  } catch {
    // Thumbnails don't exist, create them
  }

  // Ensure output directory exists
  await fs.mkdir(thumbnailsDir, { recursive: true })

  // Get video duration first
  const metadata = await getVideoInfo(videoPath)
  const duration = metadata.format.duration
  
  if (!duration) {
    throw new Error('Could not determine video duration')
  }

  // Generate thumbnails at intervals
  const timestamps = []
  for (let time = 0; time < duration; time += interval) {
    timestamps.push(time)
  }

  return new Promise((resolve, reject) => {
    console.log('Generating thumbnails for:', fullInputPath)
    
    ffmpeg(fullInputPath)
      .screenshots({
        timestamps: timestamps.map(t => t.toString()),
        filename: 'thumb_%i.jpg',
        folder: thumbnailsDir,
        size: '160x90'
      })
      .on('end', async () => {
        console.log('Thumbnails generated, creating VTT file')
        
        // Create WebVTT file
        let vttContent = 'WEBVTT\n\n'
        
        for (let i = 0; i < timestamps.length; i++) {
          const startTime = timestamps[i]
          const endTime = i < timestamps.length - 1 ? timestamps[i + 1] : duration
          
          const startTimeFormatted = formatTime(startTime)
          const endTimeFormatted = formatTime(endTime)
          
          vttContent += `${startTimeFormatted} --> ${endTimeFormatted}\n`
          vttContent += `/api/files/${outputDir}/${baseName}_thumbnails/thumb_${i + 1}.jpg\n\n`
        }
        
        try {
          await fs.writeFile(fullVttPath, vttContent)
          console.log('VTT file created:', vttPath)
          resolve({ 
            thumbnailsPath: `${outputDir}/${baseName}_thumbnails`, 
            vttPath 
          })
        } catch (error) {
          reject(error)
        }
      })
      .on('error', (err) => {
        console.error('Thumbnail generation error:', err)
        reject(err)
      })
  })
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`
}

export async function generateVideoThumbnail(
  videoPath: string,
  timestamp: string = '00:00:01'
): Promise<string> {
  const fullInputPath = path.join(DATA_DIR, videoPath)
  const baseName = path.basename(videoPath, path.extname(videoPath))
  const outputFileName = baseName + '_thumb.jpg'
  const outputDir = path.dirname(videoPath)
  const outputPath = path.join(outputDir, outputFileName)
  const fullOutputPath = path.join(DATA_DIR, outputPath)

  // Check if thumbnail already exists
  try {
    await fs.access(fullOutputPath)
    console.log('Thumbnail already exists:', outputPath)
    return outputPath
  } catch {
    // Thumbnail doesn't exist, create it
  }

  // Ensure output directory exists
  await fs.mkdir(path.dirname(fullOutputPath), { recursive: true })

  return new Promise((resolve, reject) => {
    console.log('Generating thumbnail:', fullInputPath, '->', fullOutputPath)
    
    ffmpeg(fullInputPath)
      .seekInput(timestamp)
      .outputOptions([
        '-vframes', '1',
        '-vf', 'scale=320:320:force_original_aspect_ratio=decrease,pad=320:320:(ow-iw)/2:(oh-ih)/2:black'
      ])
      .output(fullOutputPath)
      .on('end', () => {
        console.log('Thumbnail generated:', outputPath)
        resolve(outputPath)
      })
      .on('error', (err) => {
        console.error('Thumbnail generation error:', err)
        reject(err)
      })
      .run()
  })
}