import fs from 'fs/promises'
import path from 'path'
import type { Metadata } from '@/types'

const DATA_DIR = process.env.DATA_DIR || './data'

export async function getMetadata(filePath: string): Promise<Metadata> {
  const metadataPath = path.join(DATA_DIR, `${filePath}.txt`)
  
  try {
    const content = await fs.readFile(metadataPath, 'utf-8')
    return parseMetadata(content)
  } catch (error) {
    return {}
  }
}

export async function saveMetadata(
  filePath: string,
  metadata: Metadata,
  user: { name: string; email: string }
): Promise<void> {
  const metadataPath = path.join(DATA_DIR, `${filePath}.txt`)
  
  // Update metadata
  metadata.lastModified = new Date().toISOString()
  metadata.modifiedBy = `${user.name} <${user.email}>`
  
  const content = formatMetadata(metadata)
  await fs.writeFile(metadataPath, content, 'utf-8')
}

export async function addComment(
  filePath: string,
  comment: string,
  user: { name: string; email: string }
): Promise<void> {
  const metadata = await getMetadata(filePath)
  
  if (!metadata.comments) {
    metadata.comments = []
  }
  
  const timestamp = new Date().toISOString()
  const formattedComment = `[${timestamp}] ${user.name}: ${comment}`
  metadata.comments.push(formattedComment)
  
  await saveMetadata(filePath, metadata, user)
}

export async function setRating(
  filePath: string,
  rating: number,
  user: { name: string; email: string }
): Promise<void> {
  const metadata = await getMetadata(filePath)
  metadata.rating = rating
  await saveMetadata(filePath, metadata, user)
}

export async function toggleSelection(
  filePath: string,
  user: { name: string; email: string }
): Promise<boolean> {
  const metadata = await getMetadata(filePath)
  metadata.selected = !metadata.selected
  await saveMetadata(filePath, metadata, user)
  return metadata.selected
}

function parseMetadata(content: string): Metadata {
  const metadata: Metadata = {}
  const lines = content.split('\n')
  let currentSection = ''
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    if (trimmed.startsWith('=== ') && trimmed.endsWith(' ===')) {
      currentSection = trimmed.slice(4, -4).toLowerCase()
      continue
    }
    
    if (!trimmed) continue
    
    switch (currentSection) {
      case 'info':
        if (trimmed.startsWith('Selected: ')) {
          metadata.selected = trimmed.slice(10) === 'true'
        } else if (trimmed.startsWith('Rating: ')) {
          metadata.rating = parseInt(trimmed.slice(8))
        } else if (trimmed.startsWith('Last Modified: ')) {
          metadata.lastModified = trimmed.slice(15)
        } else if (trimmed.startsWith('Modified By: ')) {
          metadata.modifiedBy = trimmed.slice(13)
        } else if (trimmed.startsWith('Converted Path: ')) {
          metadata.convertedPath = trimmed.slice(16)
        } else if (trimmed.startsWith('Conversion Date: ')) {
          metadata.conversionDate = trimmed.slice(17)
        }
        break;
        
      case 'tags':
        if (!metadata.tags) metadata.tags = []
        metadata.tags.push(trimmed)
        break;
        
      case 'comments':
        if (!metadata.comments) metadata.comments = []
        metadata.comments.push(trimmed)
        break;
        
      case 'notes':
        if (!metadata.notes) metadata.notes = ''
        metadata.notes += (metadata.notes ? '\n' : '') + trimmed
        break;
    }
  }
  
  return metadata
}

function formatMetadata(metadata: Metadata): string {
  let content = '=== INFO ===\n'
  
  if (metadata.selected !== undefined) {
    content += `Selected: ${metadata.selected}\n`
  }
  if (metadata.rating !== undefined) {
    content += `Rating: ${metadata.rating}\n`
  }
  if (metadata.lastModified) {
    content += `Last Modified: ${metadata.lastModified}\n`
  }
  if (metadata.modifiedBy) {
    content += `Modified By: ${metadata.modifiedBy}\n`
  }
  if (metadata.convertedPath) {
    content += `Converted Path: ${metadata.convertedPath}\n`
  }
  if (metadata.conversionDate) {
    content += `Conversion Date: ${metadata.conversionDate}\n`
  }
  
  if (metadata.tags && metadata.tags.length > 0) {
    content += '\n=== TAGS ===\n'
    metadata.tags.forEach(tag => {
      content += `${tag}\n`
    })
  }
  
  if (metadata.comments && metadata.comments.length > 0) {
    content += '\n=== COMMENTS ===\n'
    metadata.comments.forEach(comment => {
      content += `${comment}\n`
    })
  }
  
  if (metadata.notes) {
    content += '\n=== NOTES ===\n'
    content += metadata.notes + '\n'
  }
  
  return content
}