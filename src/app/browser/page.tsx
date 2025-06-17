'use client'

import { useEffect, useState, useRef } from 'react'
import dynamicImport from 'next/dynamic'
// Force dynamic rendering to avoid SSR issues
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { useRouter, useSearchParams } from 'next/navigation'
const FileBrowser = dynamicImport(() => import('@/components/browser/FileBrowser').then(mod => ({ default: mod.FileBrowser })), { ssr: false })
const Header = dynamicImport(() => import('@/components/layout/Header').then(mod => ({ default: mod.Header })), { ssr: false })
const UploadDialog = dynamicImport(() => import('@/components/upload/UploadDialog').then(mod => ({ default: mod.UploadDialog })), { ssr: false })
const FileDetail = dynamicImport(() => import('@/components/detail/FileDetail').then(mod => ({ default: mod.FileDetail })), { ssr: false })
const DownloadCollection = dynamicImport(() => import('@/components/download/DownloadCollection').then(mod => ({ default: mod.DownloadCollection })), { ssr: false })
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
  const [customOrder, setCustomOrder] = useState<Record<string, FileItem[]>>({})
  const [isSortMode, setIsSortMode] = useState(false)
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
      if (selectedFile || showUpload || showDownloadCollection) return

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
          if (isSortMode) {
            // Exit sort mode
            setIsSortMode(false)
          } else {
            // Toggle sort mode or open file/folder
            if (e.shiftKey) {
              // Shift+Enter: Toggle sort mode
              setIsSortMode(true)
            } else {
              // Regular Enter: Open selected file/folder
              if (files[selectedIndex]) {
                const selectedItem = files[selectedIndex]
                if (selectedItem.type === 'folder') {
                  handleNavigate(selectedItem.path)
                } else {
                  setSelectedFile(selectedItem)
                }
              }
            }
          }
          break
          
        case ' ': // Spacebar
          e.preventDefault()
          e.stopPropagation()
          // Quick Look - open lightbox for files only
          if (files[selectedIndex] && files[selectedIndex].type === 'file') {
            console.log('Opening Quick Look for:', files[selectedIndex].name)
            setSelectedFile(files[selectedIndex])
          } else {
            console.log('No file selected or selected item is not a file')
          }
          break

        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          e.preventDefault()
          if (isSortMode) {
            // In sort mode: Move selected item to position (1-5)
            const targetPosition = parseInt(e.key) - 1
            if (targetPosition < files.length && targetPosition !== selectedIndex) {
              const newFiles = [...files]
              const [movedItem] = newFiles.splice(selectedIndex, 1)
              newFiles.splice(targetPosition, 0, movedItem)
              handleFilesReorder(newFiles)
              setSelectedIndex(targetPosition)
            }
          } else {
            // Normal mode: Rate selected file
            if (files[selectedIndex] && files[selectedIndex].type === 'file') {
              const rating = parseInt(e.key)
              handleRating(files[selectedIndex].path, rating)
            }
          }
          break

        case 'Escape':
          e.preventDefault()
          if (isSortMode) {
            setIsSortMode(false)
          }
          break
      }
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedFile, showUpload, currentPath, files, selectedIndex, isSortMode])

  async function fetchUser() {
    try {
      console.log('Fetching user session...')
      const res = await fetch('/api/auth/me', {
        credentials: 'include'
      })
      console.log('Auth check response:', res.status)
      
      if (!res.ok) {
        console.error('Not authenticated, redirecting to login')
        router.push('/')
        return
      }
      
      const data = await res.json()
      console.log('User data:', data)
      const user = data.user
      setUser(user)
      
      // If user has a startPath and no path is currently specified, redirect to startPath
      if (user.startPath && !path) {
        console.log(`Redirecting user to start path: ${user.startPath}`)
        router.push(`/browser?path=${encodeURIComponent(user.startPath)}`)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
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
      updateFileRating(filePath, rating)
    } catch (error) {
      console.error('Error setting rating:', error)
    }
  }

  function updateFileRating(filePath: string, rating: number) {
    const updatedFiles = files.map(file => 
      file.path === filePath 
        ? { ...file, metadata: { ...file.metadata, rating } }
        : file
    )
    setFiles(updatedFiles)
  }

  function handleFilesReorder(newOrder: FileItem[]) {
    setFiles(newOrder)
    // Save custom order for this directory
    setCustomOrder(prev => ({
      ...prev,
      [currentPath]: newOrder
    }))
    
    // Optional: Save to localStorage for persistence
    if (typeof window !== 'undefined') {
      try {
        const existingOrders = JSON.parse(localStorage.getItem('pikachu-file-orders') || '{}')
        existingOrders[currentPath] = newOrder.map(file => file.path)
        localStorage.setItem('pikachu-file-orders', JSON.stringify(existingOrders))
      } catch (error) {
        console.error('Error saving file order:', error)
      }
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
          isSortMode={isSortMode}
          user={user}
          onNavigate={handleNavigate}
          onRefresh={handleRefresh}
          onSelectFile={setSelectedFile}
          onSetSelectedIndex={setSelectedIndex}
          onFilesReorder={handleFilesReorder}
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
          onRatingUpdate={updateFileRating}
        />
      )}
    </div>
  )
}