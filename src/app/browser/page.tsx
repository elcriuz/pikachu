'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FileBrowser } from '@/components/browser/FileBrowser'
import { Header } from '@/components/layout/Header'
import { UploadDialog } from '@/components/upload/UploadDialog'
import { FileDetail } from '@/components/detail/FileDetail'
import { DownloadCollection } from '@/components/download/DownloadCollection'
import { lighttableStore } from '@/lib/lighttable-store'
import { downloadStore } from '@/lib/download-store'
import { Layout } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { KeyboardShortcutsToggle } from '@/components/ui/KeyboardShortcuts'
import type { FileItem, User } from '@/types'

export default function BrowserPage() {
  const [user, setUser] = useState<User | null>(null)
  const [files, setFiles] = useState<FileItem[]>([])
  const [currentPath, setCurrentPath] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [lighttableCount, setLighttableCount] = useState(0)
  const [downloadCount, setDownloadCount] = useState(0)
  const [showDownloadCollection, setShowDownloadCollection] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()
  const searchParams = useSearchParams()
  const path = searchParams.get('path') || ''

  useEffect(() => {
    fetchUser()
    
    // Hydration and store setup
    setIsHydrated(true)
    setLighttableCount(lighttableStore.getState().items.length)
    setDownloadCount(downloadStore.getState().items.length)
    
    const unsubscribeLighttable = lighttableStore.subscribe((state) => {
      setLighttableCount(state.items.length)
    })
    
    const unsubscribeDownload = downloadStore.subscribe((state) => {
      setDownloadCount(state.items.length)
    })
    
    return () => {
      unsubscribeLighttable()
      unsubscribeDownload()
    }
  }, [])

  useEffect(() => {
    if (user) {
      setCurrentPath(path)
      fetchFiles(path)
      setSelectedIndex(0) // Reset selection when changing directories
    }
  }, [path, user])

  const preserveSelectionRef = useRef(false)

  useEffect(() => {
    // Reset selection when files change, but only if we're not preserving it
    if (!preserveSelectionRef.current) {
      setSelectedIndex(0)
    }
    preserveSelectionRef.current = false
  }, [files])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard navigation when not in a modal/dialog
      if (selectedFile || showUpload) return

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          // Go up one directory
          const parentPath = currentPath.split('/').slice(0, -1).join('/')
          handleNavigate(parentPath)
          break
          
        case 'ArrowLeft':
          e.preventDefault()
          // Select previous file
          if (files.length > 0) {
            setSelectedIndex(prev => prev > 0 ? prev - 1 : files.length - 1)
          }
          break
          
        case 'ArrowRight':
          e.preventDefault()
          // Select next file
          if (files.length > 0) {
            setSelectedIndex(prev => prev < files.length - 1 ? prev + 1 : 0)
          }
          break
          
        case 'Enter':
          e.preventDefault()
          // Open selected file/folder
          if (files[selectedIndex]) {
            const selectedItem = files[selectedIndex]
            if (selectedItem.type === 'folder') {
              handleNavigate(selectedItem.path)
            } else {
              setSelectedFile(selectedItem)
            }
          }
          break

        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          e.preventDefault()
          // Rate selected file
          if (files[selectedIndex] && files[selectedIndex].type === 'file') {
            const rating = parseInt(e.key)
            handleRating(files[selectedIndex].path, rating)
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedFile, showUpload, currentPath, files, selectedIndex])

  async function fetchUser() {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        router.push('/')
        return
      }
      const data = await res.json()
      setUser(data.user)
    } catch (error) {
      router.push('/')
    }
  }

  async function fetchFiles(path: string) {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/files?path=${encodeURIComponent(path)}`)
      const data = await res.json()
      setFiles(data.files)
    } catch (error) {
      console.error('Error fetching files:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function handleNavigate(newPath: string) {
    router.push(`/browser?path=${encodeURIComponent(newPath)}`)
  }

  function handleRefresh() {
    fetchFiles(currentPath)
  }

  async function handleRating(filePath: string, rating: number) {
    try {
      await fetch('/api/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath, action: 'rating', rating }),
      })
      // Update only the specific file's metadata to avoid flicker
      preserveSelectionRef.current = true
      const updatedFiles = files.map(file => 
        file.path === filePath 
          ? { ...file, metadata: { ...file.metadata, rating } }
          : file
      )
      setFiles(updatedFiles)
    } catch (error) {
      console.error('Error setting rating:', error)
    }
  }

  if (!user) return null

  return (
    <div className="flex h-screen flex-col">
      <Header 
        user={user} 
        currentPath={currentPath}
        onUpload={() => setShowUpload(true)}
        onShowDetails={() => {}}
        lighttableCount={isHydrated ? lighttableCount : 0}
        downloadCount={isHydrated ? downloadCount : 0}
        onShowDownloadCollection={() => setShowDownloadCollection(true)}
      />
      
      <div className="flex-1 overflow-auto">
        <FileBrowser
          files={files}
          currentPath={currentPath}
          isLoading={isLoading}
          selectedIndex={selectedIndex}
          onNavigate={handleNavigate}
          onRefresh={handleRefresh}
          onSelectFile={setSelectedFile}
          onSetSelectedIndex={setSelectedIndex}
        />
      </div>

      {/* Keyboard Shortcuts Toggle */}
      {!selectedFile && !showUpload && !showDownloadCollection && (
        <KeyboardShortcutsToggle context="browser" />
      )}

      {showUpload && (
        <UploadDialog
          currentPath={currentPath}
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            setShowUpload(false)
            handleRefresh()
          }}
        />
      )}

      {showDownloadCollection && (
        <DownloadCollection
          onClose={() => setShowDownloadCollection(false)}
        />
      )}

      {selectedFile && (
        <FileDetail
          file={selectedFile}
          allFiles={files.filter(f => f.type === 'file')}
          user={user}
          onClose={() => setSelectedFile(null)}
          onNavigate={(file) => setSelectedFile(file)}
        />
      )}
    </div>
  )
}