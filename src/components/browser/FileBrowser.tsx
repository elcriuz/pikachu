'use client'

import { useState } from 'react'
import { FileGrid } from './FileGrid'
import { CreateFolderDialog } from './CreateFolderDialog'
import { Button } from '@/components/ui/button'
import { FolderPlus, RefreshCw } from 'lucide-react'
import type { FileItem } from '@/types'

interface FileBrowserProps {
  files: FileItem[]
  currentPath: string
  isLoading: boolean
  selectedIndex?: number
  isSortMode?: boolean
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
  onNavigate,
  onRefresh,
  onSelectFile,
  onSetSelectedIndex,
  onFilesReorder,
}: FileBrowserProps) {
  const [showCreateFolder, setShowCreateFolder] = useState(false)

  return (
    <div className="p-6">
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
      
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {currentPath || 'Root'}
        </h2>
        
        <div className="flex gap-2">
          <Button
            onClick={() => setShowCreateFolder(true)}
            variant="outline"
            size="sm"
          >
            <FolderPlus className="mr-2 h-4 w-4" />
            Neuer Ordner
          </Button>
          
          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-muted-foreground">Lade...</div>
        </div>
      ) : files.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Dieser Ordner ist leer</p>
            <Button
              onClick={() => setShowCreateFolder(true)}
              variant="outline"
              size="sm"
              className="mt-4"
            >
              <FolderPlus className="mr-2 h-4 w-4" />
              Ordner erstellen
            </Button>
          </div>
        </div>
      ) : (
        <FileGrid 
          files={files} 
          selectedIndex={selectedIndex}
          isSortMode={isSortMode}
          onNavigate={onNavigate} 
          onSelectFile={onSelectFile} 
          onSetSelectedIndex={onSetSelectedIndex}
          onFilesReorder={onFilesReorder}
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
    </div>
  )
}