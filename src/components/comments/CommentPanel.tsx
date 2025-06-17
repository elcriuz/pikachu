'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Star, Send } from 'lucide-react'
import type { Comment, User } from '@/types'

interface CommentPanelProps {
  currentPath: string
  user: User
  onClose: () => void
}

export function CommentPanel({ currentPath, user, onClose }: CommentPanelProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [rating, setRating] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [currentPath])

  async function fetchComments() {
    try {
      const res = await fetch(`/api/comments?path=${encodeURIComponent(currentPath)}`)
      const data = await res.json()
      setComments(data.comments)
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim()) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: currentPath,
          content: newComment,
          rating: rating || undefined,
        }),
      })

      if (res.ok) {
        setNewComment('')
        setRating(0)
        fetchComments()
      }
    } catch (error) {
      console.error('Error posting comment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed right-0 top-0 h-full w-96 border-l bg-white shadow-lg">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="font-semibold">Kommentare</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {comments.length === 0 ? (
            <p className="text-center text-muted-foreground">
              Noch keine Kommentare
            </p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="rounded-lg border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">{comment.author}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(comment.timestamp), 'dd.MM.yyyy HH:mm', { locale: de })}
                    </span>
                  </div>
                  
                  {comment.rating && (
                    <div className="mb-2 flex">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i <= comment.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                  
                  <p className="text-sm">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="border-t p-4">
          <div className="mb-3 flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setRating(i)}
                className="p-1"
              >
                <Star
                  className={`h-5 w-5 ${
                    i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Kommentar hinzufügen..."
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || !newComment.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}