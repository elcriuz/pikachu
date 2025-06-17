'use client'

import { useState, useRef, useEffect } from 'react'
import { FileGrid } from './FileGrid'
import { CreateFolderDialog } from './CreateFolderDialog'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { Button } from '@/components/ui/button'
import { FolderPlus, RefreshCw, Upload } from 'lucide-react'
import type { FileItem, User } from '@/types'

interface FileBrowserProps {
  files: FileItem[]
  currentPath: string
  isLoading: boolean
  selectedIndex?: number
  isSortMode?: boolean
  user: User
  onNavigate: (path: string) => void
  onRefresh: () => void
  onSelectFile?: (file: FileItem) => void
  onSetSelectedIndex?: (index: number) => void
  onFilesReorder?: (newOrder: FileItem[]) => void
}

export function FileBrowser({
  files,
  currentPath,
  isLoading,
  selectedIndex = 0,
  isSortMode = false,
  user,
  onNavigate,
  onRefresh,
  onSelectFile,
  onSetSelectedIndex,
  onFilesReorder,
}: FileBrowserProps) {
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null)
  const dragCounterRef = useRef(0)
  const dropAreaRef = useRef<HTMLDivElement>(null)

  const canUpload = user && (user.role === 'admin' || user.role === 'manager')

  useEffect(() => {
    if (!canUpload) return

    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault()
    }

    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault()
    }

    window.addEventListener('dragover', handleWindowDragOver)
    window.addEventListener('drop', handleWindowDrop)

    return () => {
      window.removeEventListener('dragover', handleWindowDragOver)
      window.removeEventListener('drop', handleWindowDrop)
    }
  }, [canUpload])

  const handleDragEnter = (e: React.DragEvent) => {
    if (!canUpload) return
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (!canUpload) return
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0
      setIsDragOver(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (!canUpload) return
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    if (!canUpload) return
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    dragCounterRef.current = 0

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      files.forEach(file => {
        formData.append('files', file)
      })
      formData.append('path', currentPath)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        onRefresh()
      } else {
        console.error('Upload failed:', await response.text())
      }
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteFile = async (file: FileItem) => {
    try {
      const response = await fetch(`/api/delete?path=${encodeURIComponent(file.path)}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onRefresh()
      } else {
        const error = await response.text()
        console.error('Delete failed:', error)
        throw new Error('Delete failed')
      }
    } catch (error) {
      console.error('Delete error:', error)
      throw error
    }
  }

  return (
    <div 
      ref={dropAreaRef}
      className="p-6 relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Sort Mode Banner */}
      {isSortMode && (
        <div className="mb-4 rounded-lg bg-blue-100 border border-blue-300 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="font-medium text-blue-800">Sortier-Modus aktiv</span>
            </div>
            <div className="text-sm text-blue-600">
              Tasten 1-5: Position wählen • Enter: Beenden • Esc: Abbrechen
            </div>
          </div>
        </div>
      )}


      {/* Drag & Drop Overlay */}
      {isDragOver && canUpload && (
        <div className="absolute inset-0 z-50 bg-blue-50/90 border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center">
          <div className="text-center p-8">
            <Upload className="mx-auto h-12 w-12 text-blue-500 mb-4" />
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              Dateien hier ablegen
            </h3>
            <p className="text-blue-600">
              Dateien aus dem Finder hierher ziehen und loslassen
            </p>
          </div>
        </div>
      )}

      {/* Upload Progress Overlay */}
      {isUploading && (
        <div className="absolute inset-0 z-50 bg-gray-50/90 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Upload läuft...
            </h3>
            <p className="text-gray-600">
              Dateien werden hochgeladen
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-muted-foreground">Lade...</div>
        </div>
      ) : files.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Dieser Ordner ist leer</p>
            {canUpload && (
              <p className="text-sm text-muted-foreground mt-2">
                Dateien hier hineinziehen zum Hochladen
              </p>
            )}
          </div>
        </div>
      ) : (
        <FileGrid 
          files={files} 
          selectedIndex={selectedIndex}
          isSortMode={isSortMode}
          user={user}
          onNavigate={onNavigate} 
          onSelectFile={onSelectFile} 
          onSetSelectedIndex={onSetSelectedIndex}
          onFilesReorder={onFilesReorder}
          onDeleteFile={(file) => setFileToDelete(file)}
          onCreateFolder={() => setShowCreateFolder(true)}
        />
      )}

      {showCreateFolder && (
        <CreateFolderDialog
          currentPath={currentPath}
          onClose={() => setShowCreateFolder(false)}
          onSuccess={() => {
            setShowCreateFolder(false)
            onRefresh()
          }}
        />
      )}

      {fileToDelete && (
        <DeleteConfirmDialog
          file={fileToDelete}
          onClose={() => setFileToDelete(null)}
          onConfirm={handleDeleteFile}
        />
      )}
    </div>
  )
}