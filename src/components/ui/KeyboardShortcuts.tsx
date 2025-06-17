'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Keyboard } from 'lucide-react'

interface KeyboardShortcutsProps {
  context: 'browser' | 'lighttable' | 'lightbox'
}

export function KeyboardShortcuts({ context }: KeyboardShortcutsProps) {
  const [isOpen, setIsOpen] = useState(false)

  const shortcuts = {
    browser: [
      { key: '↑', description: 'Ein Verzeichnis nach oben' },
      { key: '← →', description: 'Zwischen Dateien navigieren' },
      { key: 'Enter', description: 'Datei öffnen / Ordner betreten' },
      { key: 'Shift+Enter', description: 'Sortier-Modus aktivieren' },
      { key: 'Leertaste', description: 'Quick Look (Lightbox öffnen)' },
      { key: '1-5', description: 'Bewerten / Im Sortier-Modus: Position' },
      { key: 'Esc', description: 'Auswahl aufheben / Sortier-Modus beenden' },
    ],
    lighttable: [
      { key: 'Mausrad', description: 'Zoom in/out' },
      { key: 'Cmd/Ctrl + 0', description: 'Zoom zurücksetzen' },
      { key: 'Cmd/Ctrl + =', description: 'Zoom in' },
      { key: 'Cmd/Ctrl + -', description: 'Zoom out' },
      { key: 'Leeren Bereich ziehen', description: 'Canvas verschieben' },
      { key: 'Foto ziehen', description: 'Foto verschieben' },
      { key: 'Ecken ziehen', description: 'Foto vergrößern/verkleinern' },
      { key: 'Delete', description: 'Ausgewählte Fotos entfernen' },
      { key: 'Esc', description: 'Auswahl aufheben' },
    ],
    lightbox: [
      { key: '← →', description: 'Zwischen Bildern navigieren' },
      { key: '1-5', description: 'Aktuelles Bild bewerten' },
      { key: 'Esc', description: 'Lightbox schließen' },
      { key: '+ =', description: 'Zoom in (nur Bilder)' },
      { key: '-', description: 'Zoom out (nur Bilder)' },
      { key: '0', description: 'Zoom zurücksetzen (nur Bilder)' },
      { key: 'c', description: 'Video konvertieren (bei Fehlern)' },
    ]
  }

  const contextTitles = {
    browser: 'Datei-Browser',
    lighttable: 'Lighttable',
    lightbox: 'Lightbox / Video-Player'
  }

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40"
        title="Keyboard Shortcuts anzeigen"
      >
        <Keyboard className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Keyboard Shortcuts
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-6">
            {Object.entries(shortcuts).map(([key, shortcutList]) => (
              <div key={key}>
                <h3 className="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wider">
                  {contextTitles[key as keyof typeof contextTitles]}
                </h3>
                <div className="space-y-2">
                  {shortcutList.map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{shortcut.description}</span>
                      <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 border border-gray-300 rounded">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t text-xs text-muted-foreground">
            <p>Tipp: Diese Shortcuts funktionieren kontextabhängig je nach aktueller Ansicht.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function KeyboardShortcutsToggle({ context }: KeyboardShortcutsProps) {
  return <KeyboardShortcuts context={context} />
}