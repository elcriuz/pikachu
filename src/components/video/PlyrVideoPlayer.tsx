'use client'

import { useRef, useEffect, useState } from 'react'
import Plyr from 'plyr-react'
import 'plyr/dist/plyr.css'

interface PlyrVideoPlayerProps {
  src: string
  poster?: string
  previewThumbnails?: string // VTT file URL for preview thumbnails
  onTimeUpdate?: (currentTime: number) => void
  onEnded?: () => void
  onError?: (error: any) => void
  className?: string
}

export function PlyrVideoPlayer({ 
  src, 
  poster, 
  previewThumbnails,
  onTimeUpdate, 
  onEnded, 
  onError,
  className = ''
}: PlyrVideoPlayerProps) {
  const plyrRef = useRef<Plyr>(null)
  const [player, setPlayer] = useState<any>(null)

  const plyrOptions = {
    controls: [
      'play-large',
      'play', 
      'progress', 
      'current-time',
      'duration',
      'mute', 
      'volume',
      'settings', 
      'pip', 
      'airplay', 
      'fullscreen'
    ],
    settings: ['quality', 'speed'],
    keyboard: {
      focused: true,
      global: true
    },
    tooltips: {
      controls: true,
      seek: true
    },
    speed: {
      selected: 1,
      options: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
    },
    quality: {
      default: 'auto',
      options: ['auto']
    },
    previewThumbnails: {
      enabled: !!previewThumbnails,
      src: previewThumbnails || ''
    },
    seekTime: 1 // Seek time in seconds when using keyboard
  }

  const videoSrc = {
    type: 'video' as const,
    sources: [
      {
        src: src,
        type: 'video/mp4'
      }
    ],
    poster: poster
  }

  useEffect(() => {
    // Wait for Plyr to be ready
    const setupPlyr = () => {
      const plyrInstance = plyrRef.current?.plyr
      
      if (plyrInstance && typeof plyrInstance.on === 'function' && plyrInstance.media) {
        console.log('Plyr instance ready:', plyrInstance)
        setPlayer(plyrInstance)

        // Wait for media to be loaded
        plyrInstance.on('loadedmetadata', () => {
          console.log('Video metadata loaded, ready for shortcuts')
        })

        // Event listeners
        plyrInstance.on('timeupdate', () => {
          if (onTimeUpdate) {
            onTimeUpdate(plyrInstance.currentTime)
          }
        })

        plyrInstance.on('ended', () => {
          if (onEnded) {
            onEnded()
          }
        })

        plyrInstance.on('error', (event: any) => {
          console.error('Plyr error:', event)
          if (onError) {
            onError(event)
          }
        })

        // Custom keyboard shortcuts for frame-by-frame navigation
        const handleKeydown = (event: KeyboardEvent) => {
          // Skip if user is typing in an input field
          const target = event.target as HTMLElement
          if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            return
          }

          // Ensure plyr and media are ready
          if (!plyrInstance || !plyrInstance.media) {
            console.log('Plyr not ready for keyboard shortcuts')
            return
          }

          try {
            const isPaused = plyrInstance.paused
            const currentTime = plyrInstance.currentTime || 0
            const duration = plyrInstance.duration || 0

            console.log('Key pressed:', event.key, 'Video paused:', isPaused, 'Time:', currentTime)

            // Only handle frame navigation when video is paused to avoid conflicts
            if (isPaused) {
              // Frame by frame navigation (when video is paused)
              if (event.key === 'ArrowLeft') {
                event.preventDefault()
                if (event.shiftKey) {
                  // Shift + Left Arrow: Go back 10 frames (assuming 30fps = ~0.33s)
                  const newTime = Math.max(0, currentTime - 0.33)
                  plyrInstance.currentTime = newTime
                  console.log('Skip back 10 frames to:', newTime)
                } else {
                  // Left Arrow: Go back 1 frame (assuming 30fps = ~0.033s)
                  const newTime = Math.max(0, currentTime - 0.033)
                  plyrInstance.currentTime = newTime
                  console.log('Skip back 1 frame to:', newTime)
                }
              }

              if (event.key === 'ArrowRight') {
                event.preventDefault()
                if (event.shiftKey) {
                  // Shift + Right Arrow: Go forward 10 frames
                  const newTime = Math.min(duration, currentTime + 0.33)
                  plyrInstance.currentTime = newTime
                  console.log('Skip forward 10 frames to:', newTime)
                } else {
                  // Right Arrow: Go forward 1 frame
                  const newTime = Math.min(duration, currentTime + 0.033)
                  plyrInstance.currentTime = newTime
                  console.log('Skip forward 1 frame to:', newTime)
                }
              }
            }

            // Period key: Pause and go forward 1 frame
            if (event.key === '.') {
              event.preventDefault()
              plyrInstance.pause()
              setTimeout(() => {
                const newTime = Math.min(duration, currentTime + 0.033)
                plyrInstance.currentTime = newTime
                console.log('Pause and step forward to:', newTime)
              }, 50)
            }

            // Comma key: Pause and go back 1 frame
            if (event.key === ',') {
              event.preventDefault()
              plyrInstance.pause()
              setTimeout(() => {
                const newTime = Math.max(0, currentTime - 0.033)
                plyrInstance.currentTime = newTime
                console.log('Pause and step back to:', newTime)
              }, 50)
            }

            // J/L keys for 10 second skip (common video editing shortcuts)
            if (event.key === 'j' || event.key === 'J') {
              event.preventDefault()
              const newTime = Math.max(0, currentTime - 10)
              plyrInstance.currentTime = newTime
              console.log('Skip back 10 seconds to:', newTime)
            }

            if (event.key === 'l' || event.key === 'L') {
              event.preventDefault()
              const newTime = Math.min(duration, currentTime + 10)
              plyrInstance.currentTime = newTime
              console.log('Skip forward 10 seconds to:', newTime)
            }

            // K key for play/pause (common video editing shortcut)
            if (event.key === 'k' || event.key === 'K') {
              event.preventDefault()
              if (isPaused) {
                plyrInstance.play()
                console.log('Play video')
              } else {
                plyrInstance.pause()
                console.log('Pause video')
              }
            }

            // Don't handle Space here - let Plyr handle it natively
            // Don't handle F/M/Arrow keys without modifiers - let Plyr handle them natively
          } catch (error) {
            console.error('Error in keyboard handler:', error)
          }
        }

        // Add keyboard event listener to document
        document.addEventListener('keydown', handleKeydown)

        // Cleanup function
        return () => {
          document.removeEventListener('keydown', handleKeydown)
          if (plyrInstance && typeof plyrInstance.destroy === 'function') {
            plyrInstance.destroy()
          }
        }
      } else {
        // Retry after a short delay if Plyr isn't ready yet
        setTimeout(setupPlyr, 100)
      }
    }

    // Initial setup attempt
    setupPlyr()
  }, [onTimeUpdate, onEnded, onError])

  return (
    <div className={`plyr-video-container ${className}`}>
      <Plyr
        ref={plyrRef}
        source={videoSrc}
        options={plyrOptions}
      />
      
      {/* Keyboard shortcuts help */}
      <div className="mt-2 text-xs text-muted-foreground">
        <details>
          <summary className="cursor-pointer">Tastatur-Shortcuts</summary>
          <div className="mt-1 space-y-1">
            <div><strong>Standard-Steuerung (Plyr):</strong></div>
            <div>Space: Play/Pause</div>
            <div>F: Vollbild</div>
            <div>M: Stumm schalten</div>
            <div>↑ ↓: Lautstärke</div>
            <div>← →: 10s vor/zurück (beim Abspielen)</div>
            <div className="mt-2"><strong>Erweiterte Navigation:</strong></div>
            <div>K: Play/Pause (Video-Editor Style)</div>
            <div>J: 10 Sekunden zurück</div>
            <div>L: 10 Sekunden vor</div>
            <div className="mt-2"><strong>Frame-Navigation (nur wenn pausiert):</strong></div>
            <div>← →: 1 Frame vor/zurück</div>
            <div>Shift + ← →: 10 Frames vor/zurück</div>
            <div>, .: Frame zurück/vor und pausieren</div>
          </div>
        </details>
      </div>
    </div>
  )
}