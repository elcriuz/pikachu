export interface User {
  email: string
  name: string
  role: 'admin' | 'user'
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
}

export interface BreadcrumbItem {
  name: string
  path: string
}