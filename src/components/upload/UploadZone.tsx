'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react'
import { formatBytes } from '@/lib/utils'

interface UploadZoneProps {
  path: string
  onUploadComplete?: () => void
}

interface UploadFile {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

export function UploadZone({ path, onUploadComplete }: UploadZoneProps) {
  const [files, setFiles] = useState<Map<string, UploadFile>>(new Map())

  const uploadFile = async (file: File) => {
    const id = `${file.name}-${Date.now()}`
    
    setFiles(prev => new Map(prev).set(id, {
      file,
      progress: 0,
      status: 'uploading'
    }))

    const formData = new FormData()
    formData.append('file', file)
    formData.append('path', path)

    try {
      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100
          setFiles(prev => {
            const newFiles = new Map(prev)
            const fileData = newFiles.get(id)
            if (fileData) {
              newFiles.set(id, { ...fileData, progress })
            }
            return newFiles
          })
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          setFiles(prev => {
            const newFiles = new Map(prev)
            const fileData = newFiles.get(id)
            if (fileData) {
              newFiles.set(id, { ...fileData, status: 'success', progress: 100 })
            }
            return newFiles
          })
          onUploadComplete?.()
        } else {
          throw new Error('Upload failed')
        }
      })

      xhr.addEventListener('error', () => {
        setFiles(prev => {
          const newFiles = new Map(prev)
          const fileData = newFiles.get(id)
          if (fileData) {
            newFiles.set(id, { ...fileData, status: 'error', error: 'Upload failed' })
          }
          return newFiles
        })
      })

      xhr.open('POST', '/api/upload')
      xhr.send(formData)
    } catch (error) {
      setFiles(prev => {
        const newFiles = new Map(prev)
        const fileData = newFiles.get(id)
        if (fileData) {
          newFiles.set(id, { ...fileData, status: 'error', error: 'Upload failed' })
        }
        return newFiles
      })
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(uploadFile)
  }, [path])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi', '.webm'],
    },
  })

  const fileList = Array.from(files.values())

  return (
    <div>
      <div
        {...getRootProps()}
        className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          Ziehen Sie Dateien hierher oder klicken Sie zum Auswählen
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          JPG, PNG, GIF, WebP, MP4, MOV, AVI, WebM (max. 500MB)
        </p>
      </div>

      {fileList.length > 0 && (
        <div className="mt-4 space-y-2">
          {fileList.map(({ file, progress, status, error }) => (
            <div key={file.name} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(file.size)}
                  </p>
                </div>
                
                {status === 'uploading' && (
                  <div className="text-sm text-muted-foreground">
                    {Math.round(progress)}%
                  </div>
                )}
                
                {status === 'success' && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                
                {status === 'error' && (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              
              {status === 'uploading' && (
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
              
              {error && (
                <p className="mt-1 text-xs text-red-500">{error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}