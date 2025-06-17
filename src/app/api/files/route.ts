import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { listFiles, createFolder, deleteFile, getFile } from '@/lib/files'

export async function GET(request: NextRequest) {
  const user = await getSession(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const path = searchParams.get('path') || ''

  const files = await listFiles(path)
  return NextResponse.json({ files, path })
}

export async function POST(request: NextRequest) {
  const user = await getSession(request)
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { path, name } = await request.json()
  const folderPath = path ? `${path}/${name}` : name

  try {
    await createFolder(folderPath)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Ordner konnte nicht erstellt werden' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getSession(request)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { path } = await request.json()

  try {
    await deleteFile(path)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Datei konnte nicht gelöscht werden' },
      { status: 500 }
    )
  }
}