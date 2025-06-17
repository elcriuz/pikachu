'use client'

import { useEffect, useState } from 'react'

export default function TestVideoPage() {
  const [error, setError] = useState<string>('')
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Video Test Page</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Test 1: Direct API endpoint</h2>
          <video 
            controls 
            width="640" 
            height="360"
            onError={(e) => {
              const video = e.currentTarget
              console.error('Test video error:', {
                error: video.error,
                src: video.src,
                networkState: video.networkState,
                readyState: video.readyState
              })
              setError(`Error: ${video.error?.code} - ${video.error?.message}`)
            }}
            onLoadedMetadata={() => console.log('Test video metadata loaded')}
          >
            <source src="/api/test-video" type="video/mp4" />
          </video>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
        
        <div>
          <h2 className="text-lg font-semibold">Test 2: Original files endpoint</h2>
          <video 
            controls 
            width="640" 
            height="360"
            onError={(e) => console.error('Original endpoint error:', e)}
          >
            <source src="/api/files/Example%20Client/Demo%20Project/Casting/Liam_AnnyTalents/Liam_AnnyTalents_Intro_web.mp4" type="video/mp4" />
          </video>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold">Test 3: Simple video element</h2>
          <video 
            controls 
            width="640" 
            height="360"
            src="/api/test-video"
            onError={(e) => console.error('Simple video error:', e)}
          />
        </div>
      </div>
    </div>
  )
}