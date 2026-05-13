'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

interface Comment {
  id: string
  user_id: string
  content: string
  created_at: string
  username: string | null
  avatarPublicUrl: string | null
}

interface Props {
  boardId: string
  initialComments: Comment[]
  currentUserId: string | null
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금 전'
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}일 전`
  return new Date(dateStr).toLocaleDateString('ko-KR')
}

export default function CommentSection({ boardId, initialComments, currentUserId }: Props) {
  const [comments, setComments] = useState(initialComments)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || !currentUserId || loading) return
    setLoading(true)

    const supabase = createClient()
    const { data: newComment } = await supabase
      .from('board_comments')
      .insert({ board_id: boardId, user_id: currentUserId, content: input.trim() })
      .select()
      .single()

    if (newComment) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', currentUserId)
        .single()

      const avatarPublicUrl = profile?.avatar_url
        ? supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl
        : null

      setComments((prev) => [
        ...prev,
        {
          id: newComment.id,
          user_id: newComment.user_id,
          content: newComment.content,
          created_at: newComment.created_at,
          username: profile?.username ?? null,
          avatarPublicUrl,
        },
      ])
      setInput('')
    }
    setLoading(false)
  }

  async function handleDelete(commentId: string) {
    const supabase = createClient()
    await supabase.from('board_comments').delete().eq('id', commentId)
    setComments((prev) => prev.filter((c) => c.id !== commentId))
  }

  return (
    <div className="mt-12 border-t border-zinc-200 dark:border-zinc-800 pt-8">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 mb-5">
        댓글{' '}
        {comments.length > 0 && (
          <span className="text-zinc-400 dark:text-zinc-500 font-normal">{comments.length}</span>
        )}
      </h2>

      {/* 댓글 목록 */}
      {comments.length > 0 ? (
        <div className="flex flex-col gap-5 mb-6">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 group">
              {/* 아바타 */}
              {comment.avatarPublicUrl ? (
                <img
                  src={comment.avatarPublicUrl}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-300 shrink-0 mt-0.5">
                  {(comment.username ?? '?')[0].toUpperCase()}
                </div>
              )}
              {/* 내용 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {comment.username ?? '익명'}
                  </span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    {timeAgo(comment.created_at)}
                  </span>
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-0.5 break-words leading-relaxed">
                  {comment.content}
                </p>
              </div>
              {/* 삭제 버튼 (본인 댓글만) */}
              {currentUserId === comment.user_id && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="shrink-0 text-xs text-zinc-300 dark:text-zinc-600 hover:text-red-400 dark:hover:text-red-500 opacity-0 group-hover:opacity-100 transition mt-1"
                >
                  삭제
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-6">
          아직 댓글이 없어요. 첫 댓글을 남겨보세요!
        </p>
      )}

      {/* 댓글 입력 */}
      {currentUserId ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="댓글을 입력하세요"
            maxLength={300}
            className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-400/20 transition"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="shrink-0 rounded-lg bg-zinc-900 dark:bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-40 transition"
          >
            등록
          </button>
        </form>
      ) : (
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          <Link
            href="/login"
            className="text-zinc-700 dark:text-zinc-300 underline hover:text-zinc-900 dark:hover:text-zinc-50 transition"
          >
            로그인
          </Link>
          하고 댓글을 남겨보세요.
        </p>
      )}
    </div>
  )
}
