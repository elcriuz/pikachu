'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronRight, ChevronDown, Folder, FolderOpen, Check, X } from 'lucide-react'

interface FolderItem {
  name: string
  path: string
  children?: FolderItem[]
  isExpanded?: boolean
}

interface PathSelectorProps {
  currentPath?: string
  onSelect: (path: string) => void
  onCancel: () => void
  title?: string
}

export function PathSelector({ currentPath = '', onSelect, onCancel, title = 'Select Path' }: PathSelectorProps) {
  const [folderTree, setFolderTree] = useState<FolderItem[]>([])
  const [selectedPath, setSelectedPath] = useState(currentPath)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFolderStructure()
  }, [])

  async function loadFolderStructure() {
    try {
      const response = await fetch('/api/settings/folders')
      if (response.ok) {
        const data = await response.json()
        setFolderTree(data.folders)
      }
    } catch (error) {
      console.error('Failed to load folder structure:', error)
    } finally {
      setLoading(false)
    }
  }

  function toggleFolder(path: string) {
    setFolderTree(prevTree => updateFolderExpansion(prevTree, path))
  }

  function updateFolderExpansion(folders: FolderItem[], targetPath: string): FolderItem[] {
    return folders.map(folder => {
      if (folder.path === targetPath) {
        return { ...folder, isExpanded: !folder.isExpanded }
      }
      if (folder.children) {
        return { ...folder, children: updateFolderExpansion(folder.children, targetPath) }
      }
      return folder
    })
  }

  function renderFolder(folder: FolderItem, depth: number = 0) {
    const isSelected = selectedPath === folder.path
    const hasChildren = folder.children && folder.children.length > 0
    const isExpanded = folder.isExpanded

    return (
      <div key={folder.path}>
        <div 
          className={`flex items-center py-1 px-2 cursor-pointer hover:bg-gray-100 rounded ${
            isSelected ? 'bg-blue-100 text-blue-700' : ''
          }`}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
          onClick={() => setSelectedPath(folder.path)}
        >
          <div className="flex items-center gap-1 flex-1">
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFolder(folder.path)
                }}
                className="p-1 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
            ) : (
              <div className="w-5" />
            )}
            
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-blue-600" />
            ) : (
              <Folder className="h-4 w-4 text-gray-600" />
            )}
            
            <span className="text-sm">{folder.name}</span>
          </div>
          
          {isSelected && <Check className="h-4 w-4 text-blue-600" />}
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {folder.children!.map(child => renderFolder(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="text-center">Loading folders...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
        {selectedPath && (
          <div className="text-sm text-gray-600">
            Selected: <code className="bg-gray-100 px-1 rounded">{selectedPath}</code>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="max-h-64 overflow-y-auto border rounded-md bg-white">
          <div 
            className={`flex items-center py-2 px-2 cursor-pointer hover:bg-gray-100 border-b ${
              selectedPath === '' ? 'bg-blue-100 text-blue-700' : ''
            }`}
            onClick={() => setSelectedPath('')}
          >
            <Folder className="h-4 w-4 text-gray-600 mr-2" />
            <span className="text-sm font-medium">(Root - No restrictions)</span>
            {selectedPath === '' && <Check className="h-4 w-4 text-blue-600 ml-auto" />}
          </div>
          
          {folderTree.map(folder => renderFolder(folder))}
        </div>
        
        <div className="flex gap-2 mt-4">
          <Button 
            onClick={() => onSelect(selectedPath)} 
            className="flex-1"
            disabled={selectedPath === currentPath}
          >
            <Check className="h-4 w-4 mr-2" />
            Select
          </Button>
          <Button 
            onClick={onCancel} 
            variant="outline"
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}