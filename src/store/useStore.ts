import { create } from 'zustand'
import type { UploadProgress } from '@/types'

interface AppState {
  uploads: Map<string, UploadProgress>
  addUpload: (upload: UploadProgress) => void
  updateUpload: (fileId: string, progress: Partial<UploadProgress>) => void
  removeUpload: (fileId: string) => void
  
  selectedProjectId: string | null
  setSelectedProject: (projectId: string | null) => void
  
  selectedBoardId: string | null
  setSelectedBoard: (boardId: string | null) => void
}

export const useStore = create<AppState>((set) => ({
  uploads: new Map(),
  
  addUpload: (upload) =>
    set((state) => {
      const newUploads = new Map(state.uploads)
      newUploads.set(upload.fileId, upload)
      return { uploads: newUploads }
    }),
    
  updateUpload: (fileId, progress) =>
    set((state) => {
      const newUploads = new Map(state.uploads)
      const existing = newUploads.get(fileId)
      if (existing) {
        newUploads.set(fileId, { ...existing, ...progress })
      }
      return { uploads: newUploads }
    }),
    
  removeUpload: (fileId) =>
    set((state) => {
      const newUploads = new Map(state.uploads)
      newUploads.delete(fileId)
      return { uploads: newUploads }
    }),
    
  selectedProjectId: null,
  setSelectedProject: (projectId) => set({ selectedProjectId: projectId }),
  
  selectedBoardId: null,
  setSelectedBoard: (boardId) => set({ selectedBoardId: boardId }),
}))