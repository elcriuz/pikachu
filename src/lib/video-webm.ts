import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import fs from 'fs/promises'

const DATA_DIR = process.env.DATA_DIR || './data'

export async function convertToWebM(
  inputPath: string,
  onProgress?: (progress: { percent: number }) => void
): Promise<string> {
  const fullInputPath = path.join(DATA_DIR, inputPath)
  const outputFileName = path.basename(inputPath, path.extname(inputPath)) + '_converted.webm'
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
    console.log('Starting WebM conversion:', fullInputPath, '->', fullOutputPath)
    
    ffmpeg(fullInputPath)
      .outputOptions([
        '-c:v libvpx-vp9',     // VP9 video codec
        '-b:v 2M',             // Video bitrate
        '-crf 33',             // Quality
        '-vf scale=-2:720',    // Scale to 720p for faster encoding
        '-c:a libopus',        // Opus audio codec
        '-b:a 128k',           // Audio bitrate
        '-f webm'              // WebM format
      ])
      .output(fullOutputPath)
      .on('start', (commandLine) => {
        console.log('FFmpeg command:', commandLine)
      })
      .on('progress', (progress) => {
        if (onProgress && progress.percent) {
          onProgress({ percent: progress.percent })
        }
      })
      .on('end', () => {
        console.log('WebM conversion completed')
        resolve(outputPath)
      })
      .on('error', (err) => {
        console.error('WebM conversion error:', err)
        reject(err)
      })
      .run()
  })
}