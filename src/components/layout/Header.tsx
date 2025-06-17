'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Upload, MessageSquare, LogOut, FolderOpen, Home, Layout, ShoppingCart, Settings } from 'lucide-react'
import type { User, BreadcrumbItem } from '@/types'
import packageJson from '../../../package.json'

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

  const breadcrumbs = getBreadcrumbs(currentPath, user.startPath)
  

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      // Force a hard refresh to ensure clean state
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
      // Fallback: still redirect even if logout API fails
      window.location.href = '/'
    }
  }

  return (
    <header className="border-b bg-white px-6 py-4">
      <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Pikachu</h1>
          <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded">
            v{packageJson.version}
          </span>
          {process.env.NODE_ENV === 'development' && (
            <span className="text-xs text-white bg-orange-500 px-2 py-1 rounded font-medium">
              DEV
            </span>
          )}
        </div>
          
          <nav className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const homePath = user.startPath ? `/browser?path=${encodeURIComponent(user.startPath)}` : '/browser'
                router.push(homePath)
              }}
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
          {(user.role === 'admin' || user.role === 'manager') && (
            <span className="text-xs text-muted-foreground hidden md:block">
              Drag & Drop Upload
            </span>
          )}
          
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
            <span className="text-sm text-muted-foreground">{user.name} ({user.role})</span>
            {user.role === 'admin' && (
              <Button 
                onClick={() => {
                  console.log('Settings clicked, navigating...');
                  router.push('/settings');
                }} 
                variant="ghost" 
                size="sm"
                title="Settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
            <Button onClick={handleLogout} variant="ghost" size="sm">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

function getBreadcrumbs(path: string, startPath?: string): BreadcrumbItem[] {
  if (!path) return []
  
  const parts = path.split('/').filter(part => part) // Remove empty parts
  const breadcrumbs: BreadcrumbItem[] = []
  
  // If user has a startPath, only show breadcrumbs from that point onwards
  if (startPath) {
    const startParts = startPath.split('/').filter(part => part)
    
    // Only show breadcrumbs if current path is within or deeper than startPath
    if (!path.startsWith(startPath)) {
      return []
    }
    
    // Remove the startPath parts from the beginning and show relative navigation
    const relativeParts = parts.slice(startParts.length)
    
    // Add the startPath as the first breadcrumb (non-clickable root)
    const startName = startParts[startParts.length - 1] || 'Root'
    breadcrumbs.push({ name: startName, path: startPath })
    
    // Add relative breadcrumbs
    relativeParts.forEach((part, index) => {
      const fullPath = startPath + '/' + relativeParts.slice(0, index + 1).join('/')
      breadcrumbs.push({ name: part, path: fullPath })
    })
  } else {
    // No restrictions - show full breadcrumbs
    parts.forEach((part, index) => {
      const fullPath = parts.slice(0, index + 1).join('/')
      breadcrumbs.push({ name: part, path: fullPath })
    })
  }
  
  return breadcrumbs
}