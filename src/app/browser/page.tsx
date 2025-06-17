'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FileBrowser } from '@/components/browser/FileBrowser'
import { Header } from '@/components/layout/Header'
import { UploadDialog } from '@/components/upload/UploadDialog'
import { FileDetail } from '@/components/detail/FileDetail'
import { lighttableStore } from '@/lib/lighttable-store'
import { Layout } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { FileItem, User } from '@/types'

export default function BrowserPage() {
  const [user, setUser] = useState<User | null>(null)
  const [files, setFiles] = useState<FileItem[]>([])
  const [currentPath, setCurrentPath] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [lighttableCount, setLighttableCount] = useState(0)
  const router = useRouter()
  const searchParams = useSearchParams()
  const path = searchParams.get('path') || ''

  useEffect(() => {
    fetchUser()
    
    // Subscribe to lighttable changes
    const unsubscribe = lighttableStore.subscribe((state) => {
      setLighttableCount(state.items.length)
    })
    
    // Initial count
    setLighttableCount(lighttableStore.getState().items.length)
    
    return unsubscribe
  }, [])

  useEffect(() => {
    if (user) {
      setCurrentPath(path)
      fetchFiles(path)
    }
  }, [path, user])

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

  if (!user) return null

  return (
    <div className="flex h-screen flex-col">
      <Header 
        user={user} 
        currentPath={currentPath}
        onUpload={() => setShowUpload(true)}
        onShowDetails={() => {}}
        lighttableCount={lighttableCount}
      />
      
      <div className="flex-1 overflow-auto">
        <FileBrowser
          files={files}
          currentPath={currentPath}
          isLoading={isLoading}
          onNavigate={handleNavigate}
          onRefresh={handleRefresh}
          onSelectFile={setSelectedFile}
        />
      </div>

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