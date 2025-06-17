'use client'

// Force dynamic rendering to avoid SSR issues
export const dynamic = 'force-dynamic'

import { useRouter } from 'next/navigation'
import { Lighttable } from '@/components/lighttable/Lighttable'

export default function LighttablePage() {
  const router = useRouter()

  return (
    <Lighttable onClose={() => router.back()} />
  )
}