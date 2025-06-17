import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { uploadFile } from '@/lib/files'

export async function POST(request: NextRequest) {
  try {
    const user = await getSession(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const path = formData.get('path') as string

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB
    const uploadResults = []

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: `File ${file.name} too large` }, { status: 400 })
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      await uploadFile(path || '', file.name, buffer)
      uploadResults.push(file.name)
    }
    
    return NextResponse.json({ success: true, uploadedFiles: uploadResults })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}