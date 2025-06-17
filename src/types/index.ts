export interface User {
  email: string
  name: string
  role: 'admin' | 'manager' | 'user'
  startPath?: string       // Optional: start path that also acts as upper navigation limit
}

export interface Metadata {
  selected?: boolean
  rating?: number
  comments?: string[]
  notes?: string
  tags?: string[]
  lastModified?: string
  modifiedBy?: string
  convertedPath?: string
  conversionDate?: string
}

export interface FileItem {
  name: string
  path: string
  type: 'file' | 'folder'
  size?: number
  modified: string
  mimeType?: string
  metadata?: Metadata
}

export interface BreadcrumbItem {
  name: string
  path: string
}

export interface Comment {
  id: string
  text: string
  content: string
  author: string
  timestamp: string
  rating?: number
}

export interface UploadProgress {
  fileId: string
  fileName: string
  progress: number
  status: 'uploading' | 'completed' | 'error'
  error?: string
}