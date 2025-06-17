import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getMetadata, saveMetadata, addComment, setRating, toggleSelection } from '@/lib/metadata'

export async function GET(request: NextRequest) {
  const user = await getSession(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const path = searchParams.get('path') || ''

  const metadata = await getMetadata(path)
  return NextResponse.json(metadata)
}

export async function POST(request: NextRequest) {
  const user = await getSession(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { path, action, ...data } = await request.json()

  try {
    switch (action) {
      case 'comment':
        await addComment(path, data.comment, user)
        break
        
      case 'rating':
        await setRating(path, data.rating, user)
        break
        
      case 'toggle-selection':
        const selected = await toggleSelection(path, user)
        return NextResponse.json({ selected })
        
      case 'update':
        await saveMetadata(path, data.metadata, user)
        break
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const metadata = await getMetadata(path)
    return NextResponse.json(metadata)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update metadata' },
      { status: 500 }
    )
  }
}