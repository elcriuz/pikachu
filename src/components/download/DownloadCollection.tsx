'use client'

import { useState, useEffect } from 'react'
import { X, Download, Trash2, ShoppingCart, Package, FileImage, FileVideo, File } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { downloadStore, type DownloadState } from '@/lib/download-store'
import { formatBytes } from '@/lib/utils'
import { KeyboardShortcutsToggle } from '@/components/ui/KeyboardShortcuts'

interface DownloadCollectionProps {
  onClose: () => void
}

export function DownloadCollection({ onClose }: DownloadCollectionProps) {
  const [state, setState] = useState<DownloadState>({ items: [], totalSize: 0 })
  const [isHydrated, setIsHydrated] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)

  useEffect(() => {
    // Load initial state after hydration
    setState(downloadStore.getState())
    setIsHydrated(true)
    
    const unsubscribe = downloadStore.subscribe(setState)
    return unsubscribe
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  const handleDownload = async () => {
    if (state.items.length === 0) return
    
    setIsDownloading(true)
    setDownloadProgress(0)
    
    try {
      console.log('Starting download for items:', state.items.map(item => item.filePath))
      
      const res = await fetch('/api/download-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: state.items.map(item => item.filePath)
        }),
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        console.error('Download failed:', errorData)
        throw new Error(errorData.error || 'Download failed')
      }
      
      // Get content length for progress
      const contentLength = res.headers.get('content-length')
      const total = parseInt(contentLength || '0', 10)
      console.log('Content length:', total)
      
      // Read the response as a stream
      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response body')
      
      const chunks: Uint8Array[] = []
      let received = 0
      
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break
        
        chunks.push(value)
        received += value.length
        
        if (total > 0) {
          setDownloadProgress(Math.round((received / total) * 100))
        }
      }
      
      // Create blob from chunks
      const blob = new Blob(chunks, { type: 'application/zip' })
      console.log('Blob created, size:', blob.size)
      
      // Create download link
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `pikachu-collection-${new Date().toISOString().split('T')[0]}.zip`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
      
      // Clear collection after successful download
      downloadStore.clearAll()
      
    } catch (error) {
      console.error('Error downloading collection:', error)
      alert(`Fehler beim Erstellen des Downloads: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
    } finally {
      setIsDownloading(false)
      setDownloadProgress(0)
    }
  }

  const getFileIcon = (mimeType?: string) => {
    if (mimeType?.startsWith('image/')) return <FileImage className="h-4 w-4" />
    if (mimeType?.startsWith('video/')) return <FileVideo className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-gray-100"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-white shadow-sm p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-6 w-6 text-gray-700" />
            <div>
              <h1 className="text-xl font-semibold">Download-Sammlung</h1>
              <p className="text-sm text-muted-foreground">
                {state.items.length} Dateien • {formatBytes(state.totalSize)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleDownload}
              disabled={state.items.length === 0 || isDownloading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? `Erstelle ZIP... ${downloadProgress}%` : 'Als ZIP herunterladen'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadStore.clearAll()}
              disabled={state.items.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Alle entfernen
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Schließen
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="absolute inset-0 pt-20 overflow-auto p-6">
        {state.items.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h2 className="text-lg font-medium mb-2">Download-Sammlung ist leer</h2>
              <p className="text-sm">
                Füge Dateien aus der Galerie hinzu, um sie als ZIP herunterzuladen.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="divide-y">
                {state.items.map((item) => (
                  <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded">
                        {getFileIcon(item.mimeType)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{item.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.filePath} • {item.fileSize ? formatBytes(item.fileSize) : 'Größe unbekannt'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadStore.removeItem(item.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              {/* Summary */}
              <div className="p-4 bg-gray-50 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Gesamt</p>
                    <p className="text-xs text-muted-foreground">
                      {state.items.length} Dateien
                    </p>
                  </div>
                  <p className="text-lg font-semibold">{formatBytes(state.totalSize)}</p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
              <p className="font-medium mb-1">So funktioniert's:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Füge Dateien aus der Galerie zur Download-Sammlung hinzu</li>
                <li>Die Sammlung bleibt zwischen Sitzungen erhalten</li>
                <li>Klicke auf "Als ZIP herunterladen" um alle Dateien zu erhalten</li>
                <li>Nach dem Download wird die Sammlung automatisch geleert</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Toggle */}
      <KeyboardShortcutsToggle context="browser" />
    </div>
  )
}