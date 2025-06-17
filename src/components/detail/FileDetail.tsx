'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, ChevronLeft, ChevronRight, Star, Check, MessageSquare, Film, Loader2, Info, Layout } from 'lucide-react'
import { PlyrVideoPlayer } from '@/components/video/PlyrVideoPlayer'
import { PDFViewer } from '@/components/pdf/PDFViewer'
import { lighttableStore } from '@/lib/lighttable-store'
import { KeyboardShortcutsToggle } from '@/components/ui/KeyboardShortcuts'
import type { FileItem, Metadata, User } from '@/types'

interface FileDetailProps {
  file: FileItem
  allFiles: FileItem[]
  user: User
  onClose: () => void
  onNavigate: (file: FileItem) => void
  onRatingUpdate?: (filePath: string, rating: number) => void
}

export function FileDetail({ file, allFiles, user, onClose, onNavigate, onRatingUpdate }: FileDetailProps) {
  const [metadata, setMetadata] = useState<Metadata>({})
  const [showMetadata, setShowMetadata] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [isConverting, setIsConverting] = useState(false)
  const [conversionProgress, setConversionProgress] = useState(0)
  const [videoError, setVideoError] = useState(false)
  const [availableVideoPath, setAvailableVideoPath] = useState(file.path)
  const [previewThumbnails, setPreviewThumbnails] = useState<string>('')
  const [imageZoom, setImageZoom] = useState(1)
  const [imageLoaded, setImageLoaded] = useState(false)
  
  const currentIndex = allFiles.findIndex(f => f.path === file.path)
  const canGoPrev = currentIndex > 0
  const canGoNext = currentIndex < allFiles.length - 1

  useEffect(() => {
    console.log('FileDetail mounted for:', file.path, 'mimeType:', file.mimeType)
    fetchMetadata()
    setVideoError(false)
    setIsConverting(false)
    setAvailableVideoPath(file.path) // Reset to original path
    setImageZoom(1) // Reset image zoom
    setImageLoaded(false)
    
    // Check for available video versions
    if (file.mimeType?.startsWith('video/')) {
      checkAvailableVersions()
      checkConversionStatus()
      loadPreviewThumbnails()
    }
    
    // Keyboard navigation
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        onClose()
      }
      
      // Spacebar closes lightbox only for non-video files
      if (e.key === ' ' && !file.mimeType?.startsWith('video/')) {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        onClose()
      }
      if (e.key === 'ArrowLeft' && canGoPrev) onNavigate(allFiles[currentIndex - 1])
      if (e.key === 'ArrowRight' && canGoNext) onNavigate(allFiles[currentIndex + 1])
      if (e.key === 'c' && videoError && !isConverting) handleConvert()
      
      // Rating shortcuts
      if (['1', '2', '3', '4', '5'].includes(e.key)) {
        e.preventDefault()
        const rating = parseInt(e.key)
        handleRating(rating)
      }
      
      // Image zoom shortcuts (only for images)
      if (file.mimeType?.startsWith('image/')) {
        if (e.key === '+' || e.key === '=') {
          e.preventDefault()
          setImageZoom(prev => Math.min(3, prev + 0.2))
        }
        if (e.key === '-') {
          e.preventDefault()
          setImageZoom(prev => Math.max(0.5, prev - 0.2))
        }
        if (e.key === '0') {
          e.preventDefault()
          setImageZoom(1)
        }
      }
    }
    
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [file, currentIndex, canGoPrev, canGoNext])

  async function fetchMetadata() {
    try {
      const res = await fetch(`/api/metadata?path=${encodeURIComponent(file.path)}`)
      const data = await res.json()
      setMetadata(data)
    } catch (error) {
      console.error('Error fetching metadata:', error)
    }
  }

  async function handleRating(rating: number) {
    try {
      await fetch('/api/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: file.path, action: 'rating', rating }),
      })
      fetchMetadata()
      // Notify parent component about rating update
      onRatingUpdate?.(file.path, rating)
    } catch (error) {
      console.error('Error setting rating:', error)
    }
  }

  async function handleToggleSelection() {
    try {
      await fetch('/api/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: file.path, action: 'toggle-selection' }),
      })
      fetchMetadata()
    } catch (error) {
      console.error('Error toggling selection:', error)
    }
  }

  async function handleAddComment() {
    if (!newComment.trim()) return
    
    try {
      await fetch('/api/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: file.path, action: 'comment', comment: newComment }),
      })
      setNewComment('')
      fetchMetadata()
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  async function loadPreviewThumbnails() {
    try {
      const res = await fetch(`/api/video-thumbnails?path=${encodeURIComponent(file.path)}`)
      if (res.ok) {
        const data = await res.json()
        setPreviewThumbnails(data.vttUrl)
        console.log('Preview thumbnails loaded:', data.vttUrl)
      }
    } catch (error) {
      console.error('Error loading preview thumbnails:', error)
    }
  }

  async function checkAvailableVersions() {
    // Check for _web.mp4 version
    if (file.path.includes('_converted.mp4')) {
      const webPath = file.path.replace('_converted.mp4', '_web.mp4')
      try {
        const res = await fetch(`/api/file-check?path=${encodeURIComponent(webPath)}`)
        const data = await res.json()
        if (data.exists) {
          console.log('Found web version:', webPath)
          setAvailableVideoPath(webPath)
          return
        }
      } catch (error) {
        console.error('Error checking web version:', error)
      }
    }
    
    // Use original path if no web version
    setAvailableVideoPath(file.path)
  }

  async function checkConversionStatus() {
    try {
      const res = await fetch(`/api/convert?path=${encodeURIComponent(file.path)}`)
      const data = await res.json()
      
      console.log('Conversion status:', data)
      
      if (data.status === 'converting' || data.status === 'starting') {
        setIsConverting(true)
        setConversionProgress(data.progress || 0)
        // Poll for updates
        setTimeout(checkConversionStatus, 1000)
      } else if (data.status === 'completed') {
        setIsConverting(false)
        setConversionProgress(100)
        fetchMetadata() // Reload metadata to get convertedPath
        setVideoError(false) // Reset video error to trigger reload
      } else if (data.status?.startsWith('error')) {
        setIsConverting(false)
        alert('Konvertierungsfehler: ' + data.status)
      } else if (data.convertedPath) {
        // Already converted
        setMetadata(prev => ({ ...prev, convertedPath: data.convertedPath }))
        setVideoError(false)
      }
    } catch (error) {
      console.error('Error checking conversion status:', error)
    }
  }

  async function handleConvert() {
    setIsConverting(true)
    setConversionProgress(0)
    
    try {
      const res = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: file.path }),
      })
      
      if (res.ok) {
        // Start polling for progress
        checkConversionStatus()
      } else {
        const error = await res.json()
        console.error('Conversion error:', error)
        setIsConverting(false)
      }
    } catch (error) {
      console.error('Error starting conversion:', error)
      setIsConverting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Navigation buttons */}
      {canGoPrev && (
        <button
          onClick={() => onNavigate(allFiles[currentIndex - 1])}
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      
      {canGoNext && (
        <button
          onClick={() => onNavigate(allFiles[currentIndex + 1])}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-8">
        {file.mimeType?.startsWith('image/') ? (
          <div className="flex items-center justify-center w-full h-full relative overflow-auto">
            <img
              src={`/api/files/${file.path}`}
              alt={file.name}
              className="object-contain transition-transform duration-200"
              style={{
                maxHeight: imageZoom === 1 ? 'calc(100vh - 200px)' : 'none',
                maxWidth: imageZoom === 1 ? 'calc(100vw - 100px)' : 'none',
                height: 'auto',
                width: 'auto',
                transform: `scale(${imageZoom})`,
                cursor: imageZoom > 1 ? 'grab' : 'default'
              }}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(false)}
            />
            {imageLoaded && (
              <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded text-sm">
                {Math.round(imageZoom * 100)}%
              </div>
            )}
            {imageLoaded && (
              <div className="absolute bottom-4 right-4 bg-black/60 text-white px-2 py-1 rounded text-xs">
                + - : Zoom | 0 : Reset
              </div>
            )}
          </div>
        ) : file.mimeType?.startsWith('video/') ? (
          <div style={{ 
            width: '100%', 
            maxWidth: 'min(1200px, 95vw)', 
            maxHeight: 'calc(85vh - 100px)',
            position: 'relative' 
          }}>
            <div style={{ marginBottom: '10px', color: 'white', fontSize: '12px' }}>
              Video path: {availableVideoPath}
            </div>
            <PlyrVideoPlayer
              src={`/api/files/${availableVideoPath}`}
              previewThumbnails={previewThumbnails}
              onError={(error) => {
                console.error('Plyr video error:', error)
                setVideoError(true)
              }}
              onTimeUpdate={(currentTime) => {
                console.log('Video time update:', currentTime)
              }}
              className="w-full"
            />
            {videoError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="rounded-lg bg-white p-6 text-center">
                  <p className="mb-4 text-lg font-semibold">Video kann nicht abgespielt werden</p>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Format: {file.mimeType}
                  </p>
                  {isConverting ? (
                    <div className="space-y-2">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                      <p className="text-sm">Konvertiere... {Math.round(conversionProgress)}%</p>
                      <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all"
                          style={{ width: `${conversionProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Button onClick={handleConvert} size="lg">
                        <Film className="mr-2 h-5 w-5" />
                        In H.264 konvertieren (Taste C)
                      </Button>
                      {file.path.includes('_converted.mp4') && (
                        <Button 
                          onClick={async () => {
                            const res = await fetch('/api/force-convert', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ path: file.path })
                            })
                            const data = await res.json()
                            if (data.success) {
                              alert('Web-Version erstellt: ' + data.outputPath)
                              window.location.reload()
                            } else {
                              alert('Fehler: ' + data.error)
                            }
                          }}
                          variant="secondary"
                          size="lg"
                        >
                          Web-kompatible Version erstellen
                        </Button>
                      )}
                      <Button 
                        onClick={async () => {
                          const res = await fetch(`/api/video-info?path=${encodeURIComponent(file.path)}`)
                          const info = await res.json()
                          console.log('Video Info:', info)
                          alert(JSON.stringify(info, null, 2))
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <Info className="mr-2 h-4 w-4" />
                        Video-Info anzeigen
                      </Button>
                      {metadata.convertedPath?.includes('_converted_converted') && (
                        <Button 
                          onClick={async () => {
                            const res = await fetch('/api/fix-metadata', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ path: file.path })
                            })
                            const data = await res.json()
                            console.log('Fix result:', data)
                            fetchMetadata()
                            setVideoError(false)
                          }}
                          variant="destructive"
                          size="sm"
                        >
                          Fix Metadata
                        </Button>
                      )}
                      <Button 
                        onClick={() => {
                          // Try to play original video
                          setMetadata(prev => ({ ...prev, convertedPath: undefined }))
                          setVideoError(false)
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Original Video versuchen
                      </Button>
                      <Button 
                        onClick={async () => {
                          const dir = file.path.substring(0, file.path.lastIndexOf('/'))
                          const res = await fetch(`/api/list-files?path=${encodeURIComponent(dir)}`)
                          const data = await res.json()
                          console.log('Files in directory:', data)
                          alert('Dateien im Ordner:\n' + data.files.map((f: any) => f.name).join('\n'))
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Ordner anzeigen
                      </Button>
                      <Button 
                        onClick={async () => {
                          // Check if converted file exists
                          const res = await fetch(`/api/file-check?path=${encodeURIComponent(metadata.convertedPath || file.path)}`)
                          const data = await res.json()
                          console.log('File check:', data)
                          alert(`Datei existiert: ${data.exists}\n${JSON.stringify(data, null, 2)}`)
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Datei prüfen
                      </Button>
                      <Button 
                        onClick={async () => {
                          // Test video API endpoint directly
                          const testPath = availableVideoPath || file.path
                          console.log('Testing video endpoint:', `/api/files/${testPath}`)
                          try {
                            const res = await fetch(`/api/files/${testPath}`)
                            console.log('API Response:', {
                              status: res.status,
                              statusText: res.statusText,
                              headers: Object.fromEntries(res.headers.entries()),
                              url: res.url
                            })
                            if (!res.ok) {
                              const text = await res.text()
                              console.error('API Error:', text)
                              alert(`API Error: ${res.status} ${res.statusText}\n${text}`)
                            } else {
                              const contentType = res.headers.get('content-type')
                              alert(`API Success!\nContent-Type: ${contentType}\nStatus: ${res.status}`)
                            }
                          } catch (err) {
                            console.error('Fetch error:', err)
                            alert(`Fetch error: ${err}`)
                          }
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Test Video API
                      </Button>
                      <a 
                        href={`/api/files/${file.path}`}
                        download
                        className="inline-flex items-center justify-center text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3"
                      >
                        Video herunterladen
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : file.mimeType === 'application/pdf' ? (
          <div style={{ 
            width: '100%', 
            maxWidth: 'min(1200px, 95vw)',
            maxHeight: 'calc(85vh - 100px)'
          }}>
            <PDFViewer
              src={`/api/files/${file.path}`}
              onError={(error) => {
                console.error('PDF error:', error)
              }}
              className="w-full h-full"
            />
          </div>
        ) : (
          <div className="rounded-lg bg-white p-8">
            <p className="text-muted-foreground">Keine Vorschau verfügbar für {file.name}</p>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Toggle */}
      <KeyboardShortcutsToggle context="lightbox" />

      {/* Metadata panel */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between text-white">
            <div>
              <h2 className="text-xl font-semibold">{file.name}</h2>
              <p className="text-sm opacity-75">
                {currentIndex + 1} von {allFiles.length}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Rating */}
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    onClick={() => handleRating(i)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`h-5 w-5 ${
                        i <= (metadata.rating || 0)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-white/50'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Selection toggle */}
              <button
                onClick={handleToggleSelection}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  metadata.selected
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {metadata.selected ? (
                  <>
                    <Check className="mr-2 inline h-4 w-4" />
                    Ausgewählt
                  </>
                ) : (
                  'Auswählen'
                )}
              </button>

              {/* Add to Lighttable */}
              {file.mimeType?.startsWith('image/') && (
                <button
                  onClick={() => {
                    lighttableStore.addItem(file.path, file.name, file.mimeType!)
                    // Visual feedback
                    const button = typeof document !== 'undefined' ? document.activeElement as HTMLElement : null
                    if (button) {
                      button.style.transform = 'scale(0.95)'
                      setTimeout(() => {
                        button.style.transform = 'scale(1)'
                      }, 150)
                    }
                  }}
                  className="rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/30 transition-all"
                >
                  <Layout className="mr-2 inline h-4 w-4" />
                  Zu Lighttable
                </button>
              )}

              {/* Comments toggle */}
              <button
                onClick={() => setShowMetadata(!showMetadata)}
                className="rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/30"
              >
                <MessageSquare className="mr-2 inline h-4 w-4" />
                Kommentare ({metadata.comments?.length || 0})
              </button>
            </div>
          </div>

          {/* Comments section */}
          {showMetadata && (
            <div className="mt-4 rounded-lg bg-white/10 p-4 backdrop-blur">
              <div className="mb-3 max-h-32 space-y-2 overflow-y-auto">
                {metadata.comments?.map((comment, i) => (
                  <div key={i} className="text-sm text-white/90">
                    {comment}
                  </div>
                ))}
                {!metadata.comments?.length && (
                  <p className="text-sm text-white/50">Noch keine Kommentare</p>
                )}
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  placeholder="Kommentar hinzufügen..."
                  className="flex-1 rounded bg-white/20 px-3 py-1 text-sm text-white placeholder-white/50 outline-none focus:bg-white/30"
                />
                <button
                  onClick={handleAddComment}
                  className="rounded bg-white/20 px-3 py-1 text-sm text-white hover:bg-white/30"
                >
                  Senden
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}