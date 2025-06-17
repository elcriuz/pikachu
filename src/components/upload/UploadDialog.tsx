'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { UploadZone } from './UploadZone'

interface UploadDialogProps {
  currentPath: string
  onClose: () => void
  onSuccess: () => void
}

export function UploadDialog({ currentPath, onClose, onSuccess }: UploadDialogProps) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Dateien hochladen</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <p className="mb-4 text-sm text-muted-foreground">
            Hochladen nach: <strong>{currentPath || 'Root'}</strong>
          </p>
          
          <UploadZone
            path={currentPath}
            onUploadComplete={onSuccess}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}