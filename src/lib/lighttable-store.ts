interface LighttableItem {
  id: string
  filePath: string
  fileName: string
  mimeType: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  zIndex: number
}

interface LighttableState {
  items: LighttableItem[]
  selectedItems: Set<string>
}

class LighttableStore {
  private state: LighttableState = {
    items: [],
    selectedItems: new Set()
  }
  
  private listeners: ((state: LighttableState) => void)[] = []
  private hydrated = false

  constructor() {
    // Don't load from localStorage during SSR
    if (typeof window !== 'undefined') {
      this.loadFromStorage()
      this.hydrated = true
    }
  }

  subscribe(listener: (state: LighttableState) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notify() {
    this.listeners.forEach(listener => listener({ ...this.state }))
    this.saveToStorage()
  }

  private saveToStorage() {
    if (typeof window === 'undefined' || !this.hydrated) return
    
    try {
      localStorage.setItem('lighttable-state', JSON.stringify({
        ...this.state,
        selectedItems: Array.from(this.state.selectedItems)
      }))
    } catch (error) {
      console.warn('Failed to save lighttable state:', error)
    }
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return
    try {
      const saved = localStorage.getItem('lighttable-state')
      if (saved) {
        const parsed = JSON.parse(saved)
        this.state = {
          ...parsed,
          selectedItems: new Set(parsed.selectedItems || [])
        }
      }
    } catch (error) {
      console.warn('Failed to load lighttable state:', error)
    }
  }

  addItem(filePath: string, fileName: string, mimeType: string) {
    const id = `${filePath}-${Date.now()}`
    const newItem: LighttableItem = {
      id,
      filePath,
      fileName,
      mimeType,
      position: { 
        x: Math.random() * 200 + 100, 
        y: Math.random() * 200 + 100 
      },
      size: { width: 200, height: 200 },
      zIndex: this.state.items.length + 1
    }

    this.state.items.push(newItem)
    this.notify()
    return id
  }

  removeItem(id: string) {
    this.state.items = this.state.items.filter(item => item.id !== id)
    this.state.selectedItems.delete(id)
    this.notify()
  }

  updateItemPosition(id: string, position: { x: number; y: number }) {
    const item = this.state.items.find(item => item.id === id)
    if (item) {
      item.position = position
      this.notify()
    }
  }

  updateItemSize(id: string, size: { width: number; height: number }) {
    const item = this.state.items.find(item => item.id === id)
    if (item) {
      item.size = size
      this.notify()
    }
  }

  bringToFront(id: string) {
    const maxZ = Math.max(...this.state.items.map(item => item.zIndex), 0)
    const item = this.state.items.find(item => item.id === id)
    if (item) {
      item.zIndex = maxZ + 1
      this.notify()
    }
  }

  selectItem(id: string) {
    this.state.selectedItems.add(id)
    this.notify()
  }

  deselectItem(id: string) {
    this.state.selectedItems.delete(id)
    this.notify()
  }

  clearSelection() {
    this.state.selectedItems.clear()
    this.notify()
  }

  getState() {
    return { ...this.state }
  }

  clearAll() {
    this.state.items = []
    this.state.selectedItems.clear()
    this.notify()
  }
}

export const lighttableStore = new LighttableStore()
export type { LighttableItem, LighttableState }