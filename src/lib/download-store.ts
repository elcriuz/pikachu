type DownloadItem = {
  id: string
  filePath: string
  fileName: string
  fileSize?: number
  mimeType?: string
  addedAt: number
}

export type DownloadState = {
  items: DownloadItem[]
  totalSize: number
}

type DownloadStore = {
  items: DownloadItem[]
  totalSize: number
  hydrated: boolean
  
  // Actions
  addItem: (filePath: string, fileName: string, fileSize?: number, mimeType?: string) => void
  removeItem: (id: string) => void
  clearAll: () => void
  hasItem: (filePath: string) => boolean
  
  // State management
  getState: () => DownloadState
  subscribe: (listener: (state: DownloadState) => void) => () => void
  loadFromStorage: () => void
  saveToStorage: () => void
}

class DownloadStoreImpl implements DownloadStore {
  items: DownloadItem[] = []
  totalSize: number = 0
  hydrated: boolean = false
  private listeners: ((state: DownloadState) => void)[] = []
  private storageKey = 'pikachu-download-collection'

  constructor() {
    // Don't load from localStorage during SSR
    if (typeof window !== 'undefined') {
      this.loadFromStorage()
      this.hydrated = true
    }
  }

  addItem(filePath: string, fileName: string, fileSize?: number, mimeType?: string) {
    // Check if already exists
    if (this.hasItem(filePath)) {
      return
    }

    const newItem: DownloadItem = {
      id: `download-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      filePath,
      fileName,
      fileSize,
      mimeType,
      addedAt: Date.now()
    }
    
    this.items.push(newItem)
    this.totalSize += fileSize || 0
    this.saveToStorage()
    this.notifyListeners()
  }

  removeItem(id: string) {
    const index = this.items.findIndex(item => item.id === id)
    if (index !== -1) {
      const removedItem = this.items[index]
      this.totalSize -= removedItem.fileSize || 0
      this.items.splice(index, 1)
      this.saveToStorage()
      this.notifyListeners()
    }
  }

  clearAll() {
    this.items = []
    this.totalSize = 0
    this.saveToStorage()
    this.notifyListeners()
  }

  hasItem(filePath: string): boolean {
    return this.items.some(item => item.filePath === filePath)
  }

  getState(): DownloadState {
    return {
      items: [...this.items],
      totalSize: this.totalSize
    }
  }

  subscribe(listener: (state: DownloadState) => void) {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private notifyListeners() {
    const state = this.getState()
    this.listeners.forEach(listener => listener(state))
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const data = JSON.parse(stored)
        this.items = data.items || []
        this.totalSize = data.totalSize || 0
        
        // Recalculate total size in case of inconsistency
        this.totalSize = this.items.reduce((sum, item) => sum + (item.fileSize || 0), 0)
      }
    } catch (error) {
      console.error('Error loading download collection from storage:', error)
    }
  }

  saveToStorage() {
    if (typeof window === 'undefined') return
    
    try {
      const data = {
        items: this.items,
        totalSize: this.totalSize
      }
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.error('Error saving download collection to storage:', error)
    }
  }
}

export const downloadStore = new DownloadStoreImpl()