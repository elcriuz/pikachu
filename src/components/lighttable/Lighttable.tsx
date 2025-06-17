'use client'

import { useState, useEffect, useRef } from 'react'
import { X, RotateCcw, Trash2, ZoomIn, ZoomOut, Move, Grip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { lighttableStore, type LighttableItem, type LighttableState } from '@/lib/lighttable-store'

interface LighttableProps {
  onClose: () => void
}

export function Lighttable({ onClose }: LighttableProps) {
  const [state, setState] = useState<LighttableState>(lighttableStore.getState())
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizingItem, setResizingItem] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsubscribe = lighttableStore.subscribe(setState)
    return unsubscribe
  }, [])

  const handleMouseDown = (e: React.MouseEvent, itemId: string) => {
    if (e.button !== 0) return // Only left click

    const item = state.items.find(i => i.id === itemId)
    if (!item) return

    const rect = e.currentTarget.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
    setDraggedItem(itemId)
    lighttableStore.bringToFront(itemId)
    lighttableStore.selectItem(itemId)

    e.preventDefault()
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedItem || !containerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const newX = e.clientX - containerRect.left - dragOffset.x
    const newY = e.clientY - containerRect.top - dragOffset.y

    lighttableStore.updateItemPosition(draggedItem, { x: newX, y: newY })
  }

  const handleMouseUp = () => {
    setDraggedItem(null)
    setResizingItem(null)
  }

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      state.selectedItems.forEach(itemId => {
        lighttableStore.removeItem(itemId)
      })
    }
    if (e.key === 'Escape') {
      lighttableStore.clearSelection()
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-gray-100"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-white shadow-sm p-4 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Lighttable</h1>
            <p className="text-sm text-muted-foreground">
              {state.items.length} Fotos • Ziehen zum Verschieben • Doppelklick zum Zoomen
            </p>
          </div>
          <div className="flex items-center gap-2">
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
        className="absolute inset-0 pt-20 overflow-hidden cursor-default"
        style={{ 
          backgroundImage: `
            radial-gradient(circle, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      >
        {state.items.map((item) => (
          <LighttablePhoto
            key={item.id}
            item={item}
            isSelected={state.selectedItems.has(item.id)}
            isDragging={draggedItem === item.id}
            onMouseDown={(e) => handleMouseDown(e, item.id)}
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

      {/* Help overlay */}
      <div className="absolute bottom-4 left-4 bg-black/80 text-white p-3 rounded text-sm">
        <div className="space-y-1">
          <div><strong>Steuerung:</strong></div>
          <div>Ziehen: Foto verschieben</div>
          <div>Doppelklick: Vergrößern/Verkleinern</div>
          <div>Delete: Ausgewählte löschen</div>
          <div>Esc: Auswahl aufheben</div>
        </div>
      </div>
    </div>
  )
}

interface LighttablePhotoProps {
  item: LighttableItem
  isSelected: boolean
  isDragging: boolean
  onMouseDown: (e: React.MouseEvent) => void
  onResize: (direction: 'increase' | 'decrease') => void
  onRemove: () => void
}

function LighttablePhoto({ 
  item, 
  isSelected, 
  isDragging, 
  onMouseDown, 
  onResize, 
  onRemove 
}: LighttablePhotoProps) {
  const handleDoubleClick = () => {
    onResize('increase')
  }

  return (
    <div
      className={`absolute border-2 bg-white shadow-lg transition-all ${
        isSelected ? 'border-blue-500' : 'border-gray-300'
      } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: item.position.x,
        top: item.position.y,
        width: item.size.width,
        height: item.size.height,
        zIndex: item.zIndex,
        transform: isDragging ? 'scale(1.02)' : 'scale(1)'
      }}
      onMouseDown={onMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {/* Image */}
      <img
        src={`/api/files/${item.filePath}`}
        alt={item.fileName}
        className="w-full h-full object-cover"
        draggable={false}
      />

      {/* Controls overlay (visible on hover or when selected) */}
      <div className={`absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors ${
        isSelected ? 'bg-black/5' : ''
      }`}>
        {/* Resize controls */}
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

        {/* Drag handle */}
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