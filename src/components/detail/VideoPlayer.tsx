'use client'

import { useEffect, useRef } from 'react'

interface VideoPlayerProps {
  src: string
  onError?: () => void
}

export function VideoPlayer({ src, onError }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load()
    }
  }, [src])

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black">
      <video
        ref={videoRef}
        controls
        className="max-w-full max-h-full"
        style={{ 
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
        onError={onError}
      >
        <source src={src} type="video/mp4" />
        <source src={src} type="video/webm" />
        <source src={src} type="video/ogg" />
        Your browser does not support the video tag.
      </video>
    </div>
  )
}