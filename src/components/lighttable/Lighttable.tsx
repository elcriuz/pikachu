'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, RotateCcw, Trash2, ZoomIn, ZoomOut, Move, Grip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { lighttableStore, type LighttableItem, type LighttableState } from '@/lib/lighttable-store'
import { KeyboardShortcutsToggle } from '@/components/ui/KeyboardShortcuts'

interface LighttableProps {
  onClose: () => void
}

export function Lighttable({ onClose }: LighttableProps) {
  const [state, setState] = useState<LighttableState>({ items: [], selectedItems: new Set() })
  const [isHydrated, setIsHydrated] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const panStart = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 })

  useEffect(() => {
    // Load initial state after hydration
    setState(lighttableStore.getState())
    setIsHydrated(true)
    
    const unsubscribe = lighttableStore.subscribe(setState)
    return unsubscribe
  }, [])

  const handleResize = (itemId: string, direction: 'increase' | 'decrease') => {
    const item = state.items.find(i => i.id === itemId)
    if (!item) return

    const factor = direction === 'increase' ? 1.2 : 0.8
    const newSize = {
      width: Math.max(100, Math.min(600, item.size.width * factor)),
      height: Math.max(100, Math.min(600, item.size.height * factor))
    }
    lighttableStore.updateItemSize(itemId, newSize)
  }

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    
    const container = containerRef.current
    if (!container) return
    
    const rect = container.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(0.1, Math.min(3, zoom * zoomFactor))
    
    // Calculate new pan offset to zoom toward mouse position
    const scaleDiff = newZoom - zoom
    const newOffsetX = panOffset.x - (mouseX * scaleDiff)
    const newOffsetY = panOffset.y - (mouseY * scaleDiff)
    
    setZoom(newZoom)
    setPanOffset({ x: newOffsetX, y: newOffsetY })
  }, [zoom, panOffset])

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start panning if clicking on empty canvas (not on photos)
    if (e.target === canvasRef.current) {
      // Clear selection when clicking on empty canvas
      lighttableStore.clearSelection()
      
      setIsPanning(true)
      panStart.current = {
        x: e.clientX,
        y: e.clientY,
        offsetX: panOffset.x,
        offsetY: panOffset.y
      }
    }
  }, [panOffset])

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        const deltaX = e.clientX - panStart.current.x
        const deltaY = e.clientY - panStart.current.y
        
        setPanOffset({
          x: panStart.current.offsetX + deltaX,
          y: panStart.current.offsetY + deltaY
        })
      }
    }

    const handleGlobalMouseUp = () => {
      setIsPanning(false)
    }

    if (isPanning && typeof document !== 'undefined') {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove)
        document.removeEventListener('mouseup', handleGlobalMouseUp)
      }
    }
  }, [isPanning])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      state.selectedItems.forEach(itemId => {
        lighttableStore.removeItem(itemId)
      })
    }
    if (e.key === 'Escape') {
      lighttableStore.clearSelection()
    }
    // Zoom controls
    if (e.key === '0' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      setZoom(1)
      setPanOffset({ x: 0, y: 0 })
    }
    if (e.key === '=' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      setZoom(prev => Math.min(3, prev * 1.2))
    }
    if (e.key === '-' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      setZoom(prev => Math.max(0.1, prev * 0.8))
    }
  }

  const resetView = () => {
    setZoom(1)
    setPanOffset({ x: 0, y: 0 })
  }

  const fitToScreen = () => {
    if (state.items.length === 0) return
    
    const container = containerRef.current
    if (!container) return
    
    const containerRect = container.getBoundingClientRect()
    const padding = 50
    
    // Calculate bounding box of all items
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    
    state.items.forEach(item => {
      minX = Math.min(minX, item.position.x)
      minY = Math.min(minY, item.position.y)
      maxX = Math.max(maxX, item.position.x + item.size.width)
      maxY = Math.max(maxY, item.position.y + item.size.height)
    })
    
    const contentWidth = maxX - minX
    const contentHeight = maxY - minY
    const containerWidth = containerRect.width - padding * 2
    const containerHeight = containerRect.height - padding * 2 - 80 // Header offset
    
    const scaleX = containerWidth / contentWidth
    const scaleY = containerHeight / contentHeight
    const newZoom = Math.min(scaleX, scaleY, 1) // Don't zoom in beyond 100%
    
    // Center the content
    const centerX = (containerWidth - contentWidth * newZoom) / 2
    const centerY = (containerHeight - contentHeight * newZoom) / 2
    
    setZoom(newZoom)
    setPanOffset({
      x: centerX - minX * newZoom,
      y: centerY - minY * newZoom
    })
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
          <div>
            <h1 className="text-xl font-semibold">Lighttable</h1>
            <p className="text-sm text-muted-foreground">
              {state.items.length} Fotos • Ziehen zum Verschieben • Ecken zum Größe ändern
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 mr-4">
              <span className="text-sm text-muted-foreground">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={resetView}
                title="Reset Zoom (Cmd+0)"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fitToScreen}
                disabled={state.items.length === 0}
                title="Fit to Screen"
              >
                <Move className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => lighttableStore.clearAll()}
              disabled={state.items.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Alle löschen
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Schließen
            </Button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div 
        ref={containerRef}
        className="absolute inset-0 pt-20 overflow-hidden"
        onWheel={handleWheel}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <div
          ref={canvasRef}
          className={`w-full h-full ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{ 
            backgroundImage: `
              radial-gradient(circle, #e5e7eb 1px, transparent 1px)
            `,
            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
            backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
            transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
            transformOrigin: '0 0'
          }}
          onMouseDown={handleCanvasMouseDown}
        >
          {state.items.map((item) => (
            <LighttablePhoto
              key={item.id}
              item={item}
              isSelected={state.selectedItems.has(item.id)}
              containerRef={containerRef}
              zoom={zoom}
              onResize={(direction) => handleResize(item.id, direction)}
              onRemove={() => lighttableStore.removeItem(item.id)}
            />
          ))}

          {state.items.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Move className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h2 className="text-lg font-medium mb-2">Lighttable ist leer</h2>
                <p className="text-sm">
                  Wähle Fotos aus der Galerie aus, um sie hier hinzuzufügen.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Keyboard Shortcuts Toggle */}
      <KeyboardShortcutsToggle context="lighttable" />
    </div>
  )
}

interface LighttablePhotoProps {
  item: LighttableItem
  isSelected: boolean
  containerRef: React.RefObject<HTMLDivElement>
  zoom: number
  onResize: (direction: 'increase' | 'decrease') => void
  onRemove: () => void
}

function LighttablePhoto({ 
  item, 
  isSelected, 
  containerRef,
  zoom,
  onResize, 
  onRemove 
}: LighttablePhotoProps) {
  const elementRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeCorner, setResizeCorner] = useState<string>('')
  
  // Store the current position/size during operations
  const [currentPos, setCurrentPos] = useState({ x: item.position.x, y: item.position.y })
  const [currentSize, setCurrentSize] = useState({ width: item.size.width, height: item.size.height })
  
  const dragStart = useRef({ mouseX: 0, mouseY: 0, offsetX: 0, offsetY: 0 })

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    
    e.preventDefault()
    e.stopPropagation()
    
    const rect = elementRef.current?.getBoundingClientRect()
    if (!rect) return
    
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top
    }
    
    setIsDragging(true)
    setCurrentPos({ x: item.position.x, y: item.position.y })
    
    lighttableStore.bringToFront(item.id)
    lighttableStore.selectItem(item.id)
  }, [item.id, item.position.x, item.position.y])

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, corner: string) => {
    if (e.button !== 0) return
    
    e.preventDefault()
    e.stopPropagation()
    
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      offsetX: 0,
      offsetY: 0
    }
    
    setIsResizing(true)
    setResizeCorner(corner)
    setCurrentPos({ x: item.position.x, y: item.position.y })
    setCurrentSize({ width: item.size.width, height: item.size.height })
    
    lighttableStore.bringToFront(item.id)
    lighttableStore.selectItem(item.id)
  }, [item.id, item.position.x, item.position.y, item.size.width, item.size.height])

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      
      const containerRect = containerRef.current.getBoundingClientRect()
      
      if (isDragging) {
        const deltaX = e.clientX - dragStart.current.mouseX
        const deltaY = e.clientY - dragStart.current.mouseY
        
        const newX = item.position.x + deltaX
        const newY = item.position.y + deltaY
        
        setCurrentPos({ x: newX, y: newY })
      }
      
      if (isResizing) {
        const deltaX = e.clientX - dragStart.current.mouseX
        const deltaY = e.clientY - dragStart.current.mouseY
        
        let newWidth = item.size.width
        let newHeight = item.size.height
        let newX = item.position.x
        let newY = item.position.y
        
        if (resizeCorner.includes('e')) {
          newWidth = Math.max(100, item.size.width + deltaX)
        }
        if (resizeCorner.includes('w')) {
          newWidth = Math.max(100, item.size.width - deltaX)
          newX = item.position.x + deltaX
          // Prevent moving past right edge
          if (newWidth === 100) {
            newX = item.position.x + item.size.width - 100
          }
        }
        if (resizeCorner.includes('s')) {
          newHeight = Math.max(100, item.size.height + deltaY)
        }
        if (resizeCorner.includes('n')) {
          newHeight = Math.max(100, item.size.height - deltaY)
          newY = item.position.y + deltaY
          // Prevent moving past bottom edge
          if (newHeight === 100) {
            newY = item.position.y + item.size.height - 100
          }
        }
        
        setCurrentPos({ x: newX, y: newY })
        setCurrentSize({ width: newWidth, height: newHeight })
      }
    }

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        lighttableStore.updateItemPosition(item.id, currentPos)
        setIsDragging(false)
      }
      
      if (isResizing) {
        lighttableStore.updateItemPosition(item.id, currentPos)
        lighttableStore.updateItemSize(item.id, currentSize)
        setIsResizing(false)
        setResizeCorner('')
      }
    }

    if ((isDragging || isResizing) && typeof document !== 'undefined') {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove)
        document.removeEventListener('mouseup', handleGlobalMouseUp)
      }
    }
  }, [isDragging, isResizing, resizeCorner, item.id, item.position.x, item.position.y, item.size.width, item.size.height, currentPos, currentSize])

  const handleDoubleClick = () => {
    onResize('increase')
  }

  // Use current position/size during operations, otherwise use item values
  const displayPos = isDragging || isResizing ? currentPos : item.position
  const displaySize = isResizing ? currentSize : item.size

  return (
    <div
      ref={elementRef}
      className={`lighttable-photo absolute border-2 bg-white shadow-lg select-none ${
        isSelected ? 'border-blue-500' : 'border-gray-300'
      } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: displayPos.x,
        top: displayPos.y,
        width: displaySize.width,
        height: displaySize.height,
        zIndex: item.zIndex
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {/* Image */}
      <img
        src={`/api/files/${item.filePath}`}
        alt={item.fileName}
        className="w-full h-full object-cover pointer-events-none"
        draggable={false}
      />

      {/* Corner resize handles */}
      {isSelected && (
        <>
          <div
            className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border border-white cursor-nw-resize hover:bg-blue-600 transition-colors"
            onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
          />
          <div
            className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white cursor-ne-resize hover:bg-blue-600 transition-colors"
            onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
          />
          <div
            className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border border-white cursor-sw-resize hover:bg-blue-600 transition-colors"
            onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
          />
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white cursor-se-resize hover:bg-blue-600 transition-colors"
            onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
          />
        </>
      )}

      {/* Controls overlay */}
      <div className={`absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors ${
        isSelected ? 'bg-black/5' : ''
      }`}>
        <div className="absolute top-1 right-1 flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="secondary"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation()
              onResize('increase')
            }}
          >
            <ZoomIn className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation()
              onResize('decrease')
            }}
          >
            <ZoomOut className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        <div className="absolute bottom-1 right-1 opacity-0 hover:opacity-100 transition-opacity">
          <Grip className="h-4 w-4 text-gray-600" />
        </div>
      </div>

      {/* File name label */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate">
        {item.fileName}
      </div>
    </div>
  )
}