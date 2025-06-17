'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Folder, FileImage, FileVideo, File, FileText, Star, Check, Loader2, Layout, Plus } from 'lucide-react'
import { formatBytes } from '@/lib/utils'
import { lighttableStore } from '@/lib/lighttable-store'
import type { FileItem, Metadata } from '@/types'

interface FileGridProps {
  files: FileItem[]
  onNavigate: (path: string) => void
  onSelectFile?: (file: FileItem) => void
}

export function FileGrid({ files, onNavigate, onSelectFile }: FileGridProps) {
  const [metadata, setMetadata] = useState<Record<string, Metadata>>({})
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({})
  const [loadingThumbs, setLoadingThumbs] = useState<Record<string, boolean>>({})

  useEffect(() => {
    // Load metadata and thumbnails for all files
    files.forEach(file => {
      if (file.type === 'file') {
        fetchMetadata(file.path)
        if (file.mimeType?.startsWith('video/')) {
          checkOrGenerateThumbnail(file.path)
        }
      }
    })
  }, [files])

  async function fetchMetadata(path: string) {
    try {
      const res = await fetch(`/api/metadata?path=${encodeURIComponent(path)}`)
      const data = await res.json()
      setMetadata(prev => ({ ...prev, [path]: data }))
    } catch (error) {
      console.error('Error fetching metadata:', error)
    }
  }

  async function checkOrGenerateThumbnail(videoPath: string) {
    // First check if thumbnail exists
    const baseName = videoPath.substring(0, videoPath.lastIndexOf('.'))
    const thumbPath = baseName + '_thumb.jpg'
    
    try {
      // Try to load the thumbnail directly
      const res = await fetch(`/api/file-check?path=${encodeURIComponent(thumbPath)}`)
      const data = await res.json()
      
      if (data.exists) {
        setThumbnails(prev => ({ ...prev, [videoPath]: `/api/files/${thumbPath}` }))
      } else {
        // Generate thumbnail if it doesn't exist
        generateThumbnail(videoPath)
      }
    } catch (error) {
      console.error('Error checking thumbnail:', error)
    }
  }

  async function generateThumbnail(videoPath: string) {
    setLoadingThumbs(prev => ({ ...prev, [videoPath]: true }))
    
    try {
      const res = await fetch('/api/thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: videoPath }),
      })
      
      if (res.ok) {
        const data = await res.json()
        setThumbnails(prev => ({ ...prev, [videoPath]: data.url }))
      }
    } catch (error) {
      console.error('Error generating thumbnail:', error)
    } finally {
      setLoadingThumbs(prev => ({ ...prev, [videoPath]: false }))
    }
  }

  async function toggleSelection(path: string) {
    try {
      const res = await fetch('/api/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, action: 'toggle-selection' }),
      })
      
      if (res.ok) {
        const data = await res.json()
        fetchMetadata(path)
      }
    } catch (error) {
      console.error('Error toggling selection:', error)
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {files.map((file) => {
        const meta = metadata[file.path] || {}
        
        return (
          <div
            key={file.path}
            className="group relative cursor-pointer rounded-lg border p-2 transition-colors hover:bg-muted/50"
          >
            <div
              onClick={() => {
                if (file.type === 'folder') {
                  onNavigate(file.path)
                } else if (onSelectFile) {
                  onSelectFile(file)
                }
              }}
            >
              <div className="relative aspect-square overflow-hidden rounded bg-muted">
                {file.type === 'folder' ? (
                  <div className="flex h-full items-center justify-center">
                    <Folder className="h-12 w-12 text-muted-foreground" />
                  </div>
                ) : file.mimeType?.startsWith('image/') ? (
                  <img
                    src={`/api/files/${file.path}`}
                    alt={file.name}
                    className="h-full w-full object-cover"
                  />
                ) : file.mimeType?.startsWith('video/') ? (
                  <div className="relative h-full w-full">
                    {thumbnails[file.path] ? (
                      <img
                        src={thumbnails[file.path]}
                        alt={file.name}
                        className="h-full w-full object-contain"
                      />
                    ) : loadingThumbs[file.path] ? (
                      <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <FileVideo className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    {/* Video indicator overlay */}
                    <div className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5">
                      <FileVideo className="h-3 w-3 text-white" />
                    </div>
                  </div>
                ) : file.mimeType === 'application/pdf' ? (
                  <div className="flex h-full items-center justify-center">
                    <FileText className="h-12 w-12 text-red-500" />
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <File className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                
                {/* Quick actions */}
                {file.type === 'file' && (
                  <div className="absolute right-2 top-2 flex gap-1">
                    {/* Add to Lighttable (only for images) */}
                    {file.mimeType?.startsWith('image/') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          lighttableStore.addItem(file.path, file.name, file.mimeType!)
                          // Visual feedback
                          const button = e.currentTarget
                          button.style.transform = 'scale(1.2)'
                          button.style.backgroundColor = '#10b981'
                          setTimeout(() => {
                            button.style.transform = 'scale(1)'
                            button.style.backgroundColor = ''
                          }, 200)
                        }}
                        className="h-6 w-6 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-green-50 transition-all"
                        title="Zu Lighttable hinzufügen"
                      >
                        <Plus className="h-3 w-3 text-green-600" />
                      </button>
                    )}
                    
                    {/* Selection indicator */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleSelection(file.path)
                      }}
                      className="h-6 w-6 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-100"
                    >
                      {meta.selected && <Check className="h-4 w-4 text-green-500" />}
                    </button>
                  </div>
                )}
              </div>
              
              <div className="mt-2">
                <p className="truncate text-sm font-medium">{file.name}</p>
                {file.size && (
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(file.size)}
                  </p>
                )}
                
                {/* Rating display */}
                {meta.rating && (
                  <div className="flex mt-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i <= meta.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}