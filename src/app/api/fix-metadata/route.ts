import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getMetadata, saveMetadata } from '@/lib/metadata'
import fs from 'fs/promises'
import path from 'path'

const DATA_DIR = process.env.DATA_DIR || './data'

export async function POST(request: NextRequest) {
  const user = await getSession(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { path: filePath } = await request.json()

  try {
    const metadata = await getMetadata(filePath)
    
    // Fix double _converted issue
    if (metadata.convertedPath?.includes('_converted_converted')) {
      const fixedPath = metadata.convertedPath.replace('_converted_converted', '_converted')
      
      // Check if the correct file exists
      const fullPath = path.join(DATA_DIR, fixedPath)
      try {
        await fs.access(fullPath)
        metadata.convertedPath = fixedPath
        await saveMetadata(filePath, metadata, user)
        
        return NextResponse.json({ 
          success: true, 
          oldPath: metadata.convertedPath,
          newPath: fixedPath 
        })
      } catch {
        // File doesn't exist, remove the converted path
        delete metadata.convertedPath
        delete metadata.conversionDate
        await saveMetadata(filePath, metadata, user)
        
        return NextResponse.json({ 
          success: true, 
          message: 'Removed invalid converted path' 
        })
      }
    }
    
    return NextResponse.json({ 
      success: false, 
      message: 'No fix needed' 
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}