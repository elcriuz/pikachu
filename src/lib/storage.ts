import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'

export async function ensureDirectories() {
  const dirs = [
    path.join(UPLOAD_DIR, 'originals'),
    path.join(UPLOAD_DIR, 'transcoded'),
    path.join(UPLOAD_DIR, 'thumbnails'),
  ]

  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true })
  }
}

export async function saveFile(
  file: Buffer,
  originalName: string,
  subfolder: 'originals' | 'transcoded' | 'thumbnails'
): Promise<string> {
  await ensureDirectories()
  
  const ext = path.extname(originalName)
  const filename = `${uuidv4()}${ext}`
  const filepath = path.join(UPLOAD_DIR, subfolder, filename)
  
  await fs.writeFile(filepath, file)
  
  return path.join(subfolder, filename)
}

export async function deleteFile(relativePath: string): Promise<void> {
  const fullPath = path.join(UPLOAD_DIR, relativePath)
  try {
    await fs.unlink(fullPath)
  } catch (error) {
    console.error('Error deleting file:', error)
  }
}

export async function getFileBuffer(relativePath: string): Promise<Buffer> {
  const fullPath = path.join(UPLOAD_DIR, relativePath)
  return await fs.readFile(fullPath)
}

export function getFileUrl(relativePath: string): string {
  return `/uploads/${relativePath}`
}

export async function getFileStats(relativePath: string) {
  const fullPath = path.join(UPLOAD_DIR, relativePath)
  const stats = await fs.stat(fullPath)
  return {
    size: stats.size,
    mimeType: getMimeType(path.extname(relativePath)),
  }
}

function getMimeType(ext: string): string {
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
  }
  
  return mimeTypes[ext.toLowerCase()] || 'application/octet-stream'
}