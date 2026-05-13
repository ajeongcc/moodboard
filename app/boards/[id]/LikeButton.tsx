'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

interface Props {
  boardId: string
  initialLiked: boolean
  initialCount: number
  userId: string | null
}

export default function LikeButton({ boardId, initialLiked, initialCount, userId }: Props) {
  const router = useRouter()
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    if (!userId) {
      router.push('/login')
      return
    }
    if (loading) return
    setLoading(true)

    const supabase = createClient()
    if (liked) {
      await supabase.from('board_likes').delete().eq('board_id', boardId).eq('user_id', userId)
      setLiked(false)
      setCount((c) => c - 1)
    } else {
      await supabase.from('board_likes').insert({ board_id: boardId, user_id: userId })
      setLiked(true)
      setCount((c) => c + 1)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
        liked
          ? 'bg-red-50 dark:bg-red-950 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900'
          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
      } disabled:opacity-50`}
    >
      <span className="text-base leading-none">{liked ? '♥' : '♡'}</span>
      <span>{count}</span>
    </button>
  )
}
