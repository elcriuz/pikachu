import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import archiver from 'archiver'
import { PassThrough } from 'stream'

const DATA_DIR = process.env.DATA_DIR || '/data'

export async function POST(request: NextRequest) {
  try {
    const { files } = await request.json()
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    console.log('Creating zip for files:', files)

    // Create a PassThrough stream
    const stream = new PassThrough()
    const chunks: Uint8Array[] = []

    // Collect chunks
    stream.on('data', (chunk) => {
      chunks.push(chunk)
    })

    // Create zip archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    })

    // Handle archive warnings
    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('Archive warning:', err)
      } else {
        throw err
      }
    })

    // Handle errors
    archive.on('error', (err) => {
      console.error('Archive error:', err)
      throw err
    })

    // Pipe archive data to the stream
    archive.pipe(stream)

    // Add files to archive
    let addedFiles = 0
    for (const filePath of files) {
      const fullPath = path.join(DATA_DIR, filePath)
      
      try {
        // Check if file exists
        await fs.access(fullPath)
        
        // Get file stats to check if it's a file
        const stats = await fs.stat(fullPath)
        if (!stats.isFile()) {
          console.warn(`Skipping non-file: ${filePath}`)
          continue
        }

        // Add file to archive with its original name
        const fileName = path.basename(filePath)
        console.log(`Adding file to archive: ${fileName} from ${fullPath}`)
        archive.file(fullPath, { name: fileName })
        addedFiles++
        
      } catch (error) {
        console.error(`Error adding file ${filePath}:`, error)
        // Continue with other files even if one fails
      }
    }

    if (addedFiles === 0) {
      return NextResponse.json({ error: 'No valid files to archive' }, { status: 400 })
    }

    // Finalize the archive (this is important!)
    const finalizePromise = archive.finalize()
    
    // Wait for the stream to end
    const bufferPromise = new Promise<Buffer>((resolve, reject) => {
      stream.on('end', () => {
        const buffer = Buffer.concat(chunks)
        console.log(`Archive created, size: ${buffer.length} bytes`)
        resolve(buffer)
      })
      stream.on('error', reject)
    })

    // Wait for both finalize and buffer collection
    await finalizePromise
    const buffer = await bufferPromise

    // Return the zip file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="pikachu-collection-${new Date().toISOString().split('T')[0]}.zip"`,
        'Content-Length': buffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('Error creating zip:', error)
    return NextResponse.json(
      { error: 'Failed to create zip file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}