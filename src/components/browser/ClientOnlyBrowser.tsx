'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const BrowserPageComponent = dynamic(() => import('@/app/browser/page'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center">
      <div className="text-muted-foreground">Lade Pikachu...</div>
    </div>
  )
})

export default function ClientOnlyBrowser() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Lade...</div>
      </div>
    )
  }

  return <BrowserPageComponent />
}