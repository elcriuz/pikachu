import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import fs from 'fs/promises'
import path from 'path'

interface FolderItem {
  name: string
  path: string
  children?: FolderItem[]
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dataPath = path.join(process.cwd(), 'data')
    const folders = await buildFolderTree(dataPath, '')

    return NextResponse.json({ folders })
  } catch (error) {
    console.error('Error reading folder structure:', error)
    return NextResponse.json({ error: 'Failed to read folder structure' }, { status: 500 })
  }
}

async function buildFolderTree(basePath: string, relativePath: string): Promise<FolderItem[]> {
  const folders: FolderItem[] = []
  
  try {
    const fullPath = path.join(basePath, relativePath)
    const entries = await fs.readdir(fullPath, { withFileTypes: true })
    
    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        const childRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name
        
        const folderItem: FolderItem = {
          name: entry.name,
          path: childRelativePath,
          children: await buildFolderTree(basePath, childRelativePath)
        }
        
        folders.push(folderItem)
      }
    }
    
    // Sort folders alphabetically
    folders.sort((a, b) => a.name.localeCompare(b.name))
    
    return folders
  } catch (error) {
    // If we can't read a directory, return empty array
    return []
  }
}