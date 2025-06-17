import fs from 'fs/promises'
import path from 'path'
import { FileItem } from '@/types'

const DATA_DIR = process.env.DATA_DIR || './data'

export async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true })
}

export async function listFiles(relativePath: string = ''): Promise<FileItem[]> {
  await ensureDataDir()
  const fullPath = path.join(DATA_DIR, relativePath)
  
  try {
    const entries = await fs.readdir(fullPath, { withFileTypes: true })
    const files: FileItem[] = []

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue // Skip hidden files
      if (entry.name.endsWith('.txt')) continue // Skip metadata files
      if (entry.name.endsWith('_thumb.jpg')) continue // Skip thumbnail files
      if (entry.name.endsWith('_thumbnails.vtt')) continue // Skip VTT files
      if (entry.name.endsWith('_thumbnails') && entry.isDirectory()) continue // Skip thumbnail directories
      
      const filePath = path.join(relativePath, entry.name)
      const stats = await fs.stat(path.join(fullPath, entry.name))

      files.push({
        name: entry.name,
        path: filePath,
        type: entry.isDirectory() ? 'folder' : 'file',
        size: entry.isFile() ? stats.size : undefined,
        modified: stats.mtime.toISOString(),
        mimeType: entry.isFile() ? getMimeType(entry.name) : undefined,
      })
    }

    return files.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name)
      return a.type === 'folder' ? -1 : 1
    })
  } catch (error) {
    console.error('Error listing files:', error)
    return []
  }
}

export async function createFolder(folderPath: string): Promise<void> {
  const fullPath = path.join(DATA_DIR, folderPath)
  await fs.mkdir(fullPath, { recursive: true })
}

export async function uploadFile(
  folderPath: string,
  fileName: string,
  buffer: Buffer
): Promise<void> {
  const fullPath = path.join(DATA_DIR, folderPath, fileName)
  await fs.mkdir(path.dirname(fullPath), { recursive: true })
  await fs.writeFile(fullPath, buffer)
}

export async function getFile(filePath: string): Promise<Buffer> {
  const fullPath = path.join(DATA_DIR, filePath)
  return await fs.readFile(fullPath)
}

export async function deleteFile(filePath: string): Promise<void> {
  const fullPath = path.join(DATA_DIR, filePath)
  const stats = await fs.stat(fullPath)
  
  if (stats.isDirectory()) {
    await fs.rm(fullPath, { recursive: true, force: true })
  } else {
    await fs.unlink(fullPath)
  }
}


function getMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase()
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.webm': 'video/webm',
    '.pdf': 'application/pdf',
  }
  
  return mimeTypes[ext] || 'application/octet-stream'
}