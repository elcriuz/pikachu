'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Folder, FileImage, FileVideo, File, FileText, Star, Check, Loader2, Layout, Plus, Download, ShoppingCart } from 'lucide-react'
import { formatBytes } from '@/lib/utils'
import { lighttableStore } from '@/lib/lighttable-store'
import { downloadStore } from '@/lib/download-store'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { FileItem, Metadata } from '@/types'

interface FileGridProps {
  files: FileItem[]
  selectedIndex?: number
  isSortMode?: boolean
  onNavigate: (path: string) => void
  onSelectFile?: (file: FileItem) => void
  onSetSelectedIndex?: (index: number) => void
  onFilesReorder?: (newOrder: FileItem[]) => void
}

export function FileGrid({ files, selectedIndex = 0, isSortMode = false, onNavigate, onSelectFile, onSetSelectedIndex, onFilesReorder }: FileGridProps) {
  const [metadata, setMetadata] = useState<Record<string, Metadata>>({})
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({})
  const [loadingThumbs, setLoadingThumbs] = useState<Record<string, boolean>>({})
  const [lighttableItems, setLighttableItems] = useState<Set<string>>(new Set())
  const [downloadItems, setDownloadItems] = useState<Set<string>>(new Set())
  const [localFiles, setLocalFiles] = useState<FileItem[]>(files)
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    setLocalFiles(files)
  }, [files])

  useEffect(() => {
    // Load metadata and thumbnails for all files
    localFiles.forEach(file => {
      if (file.type === 'file') {
        fetchMetadata(file.path)
        if (file.mimeType?.startsWith('video/')) {
          checkOrGenerateThumbnail(file.path)
        }
      }
    })
  }, [localFiles])

  useEffect(() => {
    // Subscribe to lighttable changes to track which items are in the lighttable
    const unsubscribeLighttable = lighttableStore.subscribe((state) => {
      const itemPaths = new Set(state.items.map(item => item.filePath))
      setLighttableItems(itemPaths)
    })
    
    // Subscribe to download collection changes
    const unsubscribeDownload = downloadStore.subscribe((state) => {
      const itemPaths = new Set(state.items.map(item => item.filePath))
      setDownloadItems(itemPaths)
    })
    
    // Initial load
    const initialLighttableState = lighttableStore.getState()
    const initialLighttablePaths = new Set(initialLighttableState.items.map(item => item.filePath))
    setLighttableItems(initialLighttablePaths)
    
    const initialDownloadState = downloadStore.getState()
    const initialDownloadPaths = new Set(initialDownloadState.items.map(item => item.filePath))
    setDownloadItems(initialDownloadPaths)
    
    return () => {
      unsubscribeLighttable()
      unsubscribeDownload()
    }
  }, [])

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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = localFiles.findIndex(file => file.path === active.id)
      const newIndex = localFiles.findIndex(file => file.path === over?.id)
      
      const newOrder = arrayMove(localFiles, oldIndex, newIndex)
      setLocalFiles(newOrder)
      
      // Update selected index if needed
      if (oldIndex === selectedIndex) {
        onSetSelectedIndex?.(newIndex)
      } else if (oldIndex < selectedIndex && newIndex >= selectedIndex) {
        onSetSelectedIndex?.(selectedIndex - 1)
      } else if (oldIndex > selectedIndex && newIndex <= selectedIndex) {
        onSetSelectedIndex?.(selectedIndex + 1)
      }
      
      // Notify parent component
      onFilesReorder?.(newOrder)
    }
  }

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext 
        items={localFiles.map(file => file.path)}
        strategy={rectSortingStrategy}
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {localFiles.map((file, index) => (
            <SortableFileItem
              key={file.path}
              file={file}
              index={index}
              isKeyboardSelected={index === selectedIndex}
              isSortMode={isSortMode}
              metadata={file.metadata || metadata[file.path] || {}}
              thumbnails={thumbnails}
              loadingThumbs={loadingThumbs}
              lighttableItems={lighttableItems}
              downloadItems={downloadItems}
              onNavigate={onNavigate}
              onSelectFile={onSelectFile}
              onSetSelectedIndex={onSetSelectedIndex}
              toggleSelection={toggleSelection}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

interface SortableFileItemProps {
  file: FileItem
  index: number
  isKeyboardSelected: boolean
  isSortMode: boolean
  metadata: Metadata
  thumbnails: Record<string, string>
  loadingThumbs: Record<string, boolean>
  lighttableItems: Set<string>
  downloadItems: Set<string>
  onNavigate: (path: string) => void
  onSelectFile?: (file: FileItem) => void
  onSetSelectedIndex?: (index: number) => void
  toggleSelection: (path: string) => void
}

function SortableFileItem({
  file,
  index,
  isKeyboardSelected,
  isSortMode,
  metadata: meta,
  thumbnails,
  loadingThumbs,
  lighttableItems,
  downloadItems,
  onNavigate,
  onSelectFile,
  onSetSelectedIndex,
  toggleSelection,
}: SortableFileItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.path })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group relative cursor-pointer rounded-lg border p-2 ${
        isDragging ? '' : 'transition-all duration-200 hover:bg-muted/50 hover:shadow-md'
      } ${
        isKeyboardSelected 
          ? isSortMode 
            ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200' 
            : 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
          : ''
      } ${
        isDragging 
          ? 'opacity-70 scale-105 shadow-2xl z-50 cursor-grabbing border-blue-400 bg-blue-50' 
          : ''
      } ${
        isSortMode ? 'hover:border-orange-300' : ''
      }`}
      onClick={() => {
        if (!isDragging) {
          onSetSelectedIndex?.(index)
          if (file.type === 'folder') {
            onNavigate(file.path)
          } else if (onSelectFile) {
            onSelectFile(file)
          }
        }
      }}
      title={isDragging ? 'Ziehen zum Sortieren...' : file.name}
    >
      <div>
        <div className="relative aspect-square overflow-hidden rounded bg-muted">
          {/* Sort Mode Position Indicator */}
          {isSortMode && !isDragging && (
            <div className="absolute top-1 left-1 bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10">
              {index + 1}
            </div>
          )}
          
          {/* Drag Indicator */}
          {isDragging && (
            <div className="absolute inset-0 bg-blue-500/30 border-2 border-blue-500 border-dashed rounded flex items-center justify-center z-10 pointer-events-none">
              <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium shadow-lg">
                Sortieren...
              </div>
            </div>
          )}
          
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
              {/* Add to Download Collection */}
              {downloadItems.has(file.path) ? (
                <div className="h-6 w-6 rounded-full bg-orange-500 shadow-md flex items-center justify-center"
                     title="In Download-Sammlung">
                  <ShoppingCart className="h-3 w-3 text-white" />
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    downloadStore.addItem(file.path, file.name, file.size, file.mimeType)
                    // Visual feedback
                    const button = e.currentTarget
                    button.style.transform = 'scale(1.2)'
                    button.style.backgroundColor = '#f97316'
                    setTimeout(() => {
                      button.style.transform = 'scale(1)'
                      button.style.backgroundColor = ''
                    }, 200)
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="h-6 w-6 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-orange-50 transition-all"
                  title="Zur Download-Sammlung hinzufügen"
                >
                  <Download className="h-3 w-3 text-orange-600" />
                </button>
              )}
              
              {/* Add to Lighttable (only for images) */}
              {file.mimeType?.startsWith('image/') && (
                lighttableItems.has(file.path) ? (
                  <div className="h-6 w-6 rounded-full bg-blue-500 shadow-md flex items-center justify-center"
                       title="Im Lighttable">
                    <Layout className="h-3 w-3 text-white" />
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
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
                    onMouseDown={(e) => e.stopPropagation()}
                    className="h-6 w-6 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-green-50 transition-all"
                    title="Zu Lighttable hinzufügen"
                  >
                    <Plus className="h-3 w-3 text-green-600" />
                  </button>
                )
              )}
              
              {/* Selection indicator */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  toggleSelection(file.path)
                }}
                onMouseDown={(e) => e.stopPropagation()}
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
}