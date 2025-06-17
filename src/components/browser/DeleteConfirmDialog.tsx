'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Loader2 } from 'lucide-react'
import type { FileItem } from '@/types'

interface DeleteConfirmDialogProps {
  file: FileItem
  onClose: () => void
  onConfirm: (file: FileItem) => Promise<void>
}

export function DeleteConfirmDialog({ file, onClose, onConfirm }: DeleteConfirmDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm(file)
      onClose()
    } catch (error) {
      console.error('Delete failed:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {file.type === 'folder' ? 'Ordner löschen' : 'Datei löschen'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-700">
            Möchten Sie{' '}
            <span className="font-medium">"{file.name}"</span>
            {' '}wirklich löschen?
          </p>
          {file.type === 'folder' && (
            <p className="text-sm text-red-600 mt-2">
              ⚠️ Alle Inhalte des Ordners werden ebenfalls gelöscht.
            </p>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Abbrechen
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Lösche...
              </>
            ) : (
              'Löschen'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}