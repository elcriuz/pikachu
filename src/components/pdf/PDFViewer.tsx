'use client'

import { useState, useCallback, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Download, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Set up PDF.js worker for Next.js - match versions
if (typeof window !== 'undefined') {
  // Use CDN to ensure version compatibility
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
  console.log('PDF.js version:', pdfjs.version)
}

interface PDFViewerProps {
  src: string
  onError?: (error: any) => void
  className?: string
}

export function PDFViewer({ src, onError, className = '' }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [rotation, setRotation] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setLoading(false)
    console.log('PDF loaded successfully, pages:', numPages)
  }, [])

  const onDocumentLoadError = useCallback((error: any) => {
    console.error('PDF load error:', error)
    console.error('PDF load error details:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
      src: src
    })
    setError(`PDF konnte nicht geladen werden: ${error?.message || 'Unbekannter Fehler'}`)
    setLoading(false)
    if (onError) {
      onError(error)
    }
  }, [onError, src])

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(1, prev - 1))
  }

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(numPages || 1, prev + 1))
  }

  const zoomIn = () => {
    setScale(prev => Math.min(3.0, prev + 0.2))
  }

  const zoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.2))
  }

  const rotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const resetZoom = () => {
    setScale(1.0)
    setRotation(0)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      // Skip if user is typing in an input field
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          goToPrevPage()
          break
        case 'ArrowRight':
          event.preventDefault()
          goToNextPage()
          break
        case '+':
        case '=':
          event.preventDefault()
          zoomIn()
          break
        case '-':
          event.preventDefault()
          zoomOut()
          break
        case 'r':
        case 'R':
          event.preventDefault()
          rotate()
          break
        case '0':
          event.preventDefault()
          resetZoom()
          break
      }
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', handleKeydown)
      return () => document.removeEventListener('keydown', handleKeydown)
    }
  }, [pageNumber, numPages])

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[400px] bg-muted rounded-lg p-8 ${className}`}>
        <FileText className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">PDF konnte nicht geladen werden</h3>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <a href={src} download target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4 mr-2" />
              PDF herunterladen
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={src} target="_blank" rel="noopener noreferrer">
              In neuem Tab öffnen
            </a>
          </Button>
          <Button 
            variant="outline"
            onClick={async () => {
              try {
                console.log('Testing PDF URL:', src)
                const response = await fetch(src)
                console.log('PDF fetch response:', {
                  status: response.status,
                  statusText: response.statusText,
                  headers: Object.fromEntries(response.headers.entries()),
                  url: response.url
                })
                if (response.ok) {
                  const blob = await response.blob()
                  console.log('PDF blob:', {
                    size: blob.size,
                    type: blob.type
                  })
                  alert(`PDF Test OK!\nStatus: ${response.status}\nGröße: ${blob.size} bytes\nType: ${blob.type}`)
                } else {
                  alert(`PDF Test Fehler!\nStatus: ${response.status} ${response.statusText}`)
                }
              } catch (err) {
                console.error('PDF test error:', err)
                alert(`PDF Test Fehler: ${err}`)
              }
            }}
          >
            Test PDF URL
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`pdf-viewer ${className}`}>
      {/* Controls */}
      <div className="flex items-center justify-between bg-muted p-3 rounded-t-lg">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-sm font-medium min-w-[100px] text-center">
            {loading ? 'Lädt...' : `${pageNumber} / ${numPages || 0}`}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={!numPages || pageNumber >= numPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={zoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <span className="text-sm font-medium min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          
          <Button variant="outline" size="sm" onClick={zoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" size="sm" onClick={rotate}>
            <RotateCw className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" size="sm" onClick={resetZoom}>
            Reset
          </Button>
          
          <Button asChild variant="outline" size="sm">
            <a href={src} download>
              <Download className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="bg-gray-100 min-h-[600px] p-4 rounded-b-lg overflow-auto">
        <div className="flex justify-center">
          <Document
            file={src}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">PDF wird geladen...</p>
                </div>
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              rotate={rotation}
              loading={
                <div className="flex items-center justify-center min-h-[400px] bg-white border rounded">
                  <p className="text-muted-foreground">Seite wird geladen...</p>
                </div>
              }
              error={
                <div className="flex items-center justify-center min-h-[400px] bg-white border rounded">
                  <p className="text-red-500">Fehler beim Laden der Seite</p>
                </div>
              }
              noData={
                <div className="flex items-center justify-center min-h-[400px] bg-white border rounded">
                  <p className="text-muted-foreground">Keine Daten verfügbar</p>
                </div>
              }
            />
          </Document>
        </div>
      </div>

      {/* Keyboard shortcuts help */}
      <div className="mt-2 text-xs text-muted-foreground">
        <details>
          <summary className="cursor-pointer">PDF Tastatur-Shortcuts</summary>
          <div className="mt-1 space-y-1">
            <div>← →: Vorherige/Nächste Seite</div>
            <div>+ -: Zoom rein/raus</div>
            <div>R: Rotieren</div>
            <div>0: Zoom zurücksetzen</div>
          </div>
        </details>
      </div>
    </div>
  )
}