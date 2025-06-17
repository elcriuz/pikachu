'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Upload, MessageSquare, LogOut, FolderOpen, Home, Layout, ShoppingCart } from 'lucide-react'
import type { User, BreadcrumbItem } from '@/types'

interface HeaderProps {
  user: User
  currentPath: string
  onUpload: () => void
  onShowDetails: () => void
  lighttableCount?: number
  downloadCount?: number
  onShowDownloadCollection?: () => void
}

export function Header({ user, currentPath, onUpload, onShowDetails, lighttableCount = 0, downloadCount = 0, onShowDownloadCollection }: HeaderProps) {
  const router = useRouter()

  const breadcrumbs = getBreadcrumbs(currentPath)

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  return (
    <>
      {/* Development Banner */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-orange-500 text-white text-center py-2 text-sm font-medium">
          🚧 DEVELOPMENT VERSION - Änderungen werden nicht auf dem Live-Server gespeichert
        </div>
      )}
      
      <header className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Pikachu</h1>
          
          <nav className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/browser')}
            >
              <Home className="h-4 w-4" />
            </Button>
            
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.path} className="flex items-center gap-2">
                <span className="text-muted-foreground">/</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/browser?path=${encodeURIComponent(crumb.path)}`)}
                >
                  {crumb.name}
                </Button>
              </div>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Button onClick={onUpload} size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
          
          <Button 
            onClick={() => router.push('/lighttable')} 
            size="sm" 
            variant="outline"
            className="relative"
          >
            <Layout className="mr-2 h-4 w-4" />
            Lighttable
            {lighttableCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {lighttableCount}
              </span>
            )}
          </Button>
          
          <Button 
            onClick={onShowDownloadCollection} 
            size="sm" 
            variant="outline"
            className="relative"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Downloads
            {downloadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {downloadCount}
              </span>
            )}
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{user.name}</span>
            <Button onClick={handleLogout} variant="ghost" size="sm">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
    </>
  )
}

function getBreadcrumbs(path: string): BreadcrumbItem[] {
  if (!path) return []
  
  const parts = path.split('/')
  const breadcrumbs: BreadcrumbItem[] = []
  
  parts.forEach((part, index) => {
    if (part) {
      const path = parts.slice(0, index + 1).join('/')
      breadcrumbs.push({ name: part, path })
    }
  })
  
  return breadcrumbs
}