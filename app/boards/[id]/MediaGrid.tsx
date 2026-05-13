'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import VideoEmbed from '@/components/VideoEmbed'
import { type MediaPlatform } from '@/utils/parseVideoUrl'

interface ImageItem { id: string; url: string }
interface VideoItem { id: string; embedUrl: string; platform: MediaPlatform }

type SelectedMedia =
  | { type: 'image'; id: string; url: string }
  | { type: 'video'; id: string; embedUrl: string; platform: MediaPlatform }

interface MediaComment {
  id: string
  user_id: string
  content: string
  created_at: string
  username: string | null
  avatarPublicUrl: string | null
}

interface Props {
  images: ImageItem[]
  videos: VideoItem[]
  boardId: string
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

const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

export default function MediaGrid({ images, videos, boardId, currentUserId }: Props) {
  const [selected, setSelected] = useState<SelectedMedia | null>(null)
  const [comments, setComments] = useState<MediaComment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [input, setInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const commentsEndRef = useRef<HTMLDivElement>(null)

  // 미디어 선택 시 댓글 불러오기
  useEffect(() => {
    if (!selected) { setComments([]); setInput(''); return }
    setLoadingComments(true)
    setComments([])

    async function fetchComments() {
      const supabase = createClient()
      const { data: raw } = await supabase
        .from('media_comments')
        .select('*')
        .eq('media_id', selected.id)
        .order('created_at', { ascending: true })

      if (!raw || raw.length === 0) { setLoadingComments(false); return }

      const ids = [...new Set(raw.map((c) => c.user_id))]
      const { data: profiles } = await supabase
        .from('profiles').select('id, username, avatar_url').in('id', ids)

      const map = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))
      setComments(raw.map((c) => {
        const p = map[c.user_id]
        return {
          id: c.id,
          user_id: c.user_id,
          content: c.content,
          created_at: c.created_at,
          username: p?.username ?? null,
          avatarPublicUrl: p?.avatar_url
            ? supabase.storage.from('avatars').getPublicUrl(p.avatar_url).data.publicUrl
            : null,
        }
      }))
      setLoadingComments(false)
    }
    fetchComments()
  }, [selected?.id])

  // 새 댓글 추가 시 스크롤
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  // Escape로 모달 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // 모달 열릴 때 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = selected ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [selected])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || !currentUserId || !selected || submitting) return
    setSubmitting(true)

    const supabase = createClient()
    const { data: newComment } = await supabase
      .from('media_comments')
      .insert({ media_id: selected.id, media_type: selected.type, board_id: boardId, user_id: currentUserId, content: input.trim() })
      .select().single()

    if (newComment) {
      const { data: profile } = await supabase.from('profiles').select('username, avatar_url').eq('id', currentUserId).single()
      setComments((prev) => [...prev, {
        id: newComment.id,
        user_id: newComment.user_id,
        content: newComment.content,
        created_at: newComment.created_at,
        username: profile?.username ?? null,
        avatarPublicUrl: profile?.avatar_url
          ? supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl
          : null,
      }])
      setInput('')
    }
    setSubmitting(false)
  }

  async function handleDelete(commentId: string) {
    const supabase = createClient()
    await supabase.from('media_comments').delete().eq('id', commentId)
    setComments((prev) => prev.filter((c) => c.id !== commentId))
  }

  if (images.length + videos.length === 0) {
    return <p className="text-center text-zinc-400 dark:text-zinc-500 py-20">아직 콘텐츠가 없어요.</p>
  }

  return (
    <>
      {/* ── 마소너리 그리드 ── */}
      <div className="columns-2 sm:columns-3 lg:columns-4 gap-[30px]">

        {/* 이미지 */}
        {images.map((image) => (
          <div
            key={image.id}
            onClick={() => setSelected({ type: 'image', id: image.id, url: image.url })}
            className="break-inside-avoid mb-[30px] rounded-[1.8px] overflow-hidden bg-zinc-100 dark:bg-zinc-800 cursor-pointer group relative"
          >
            <img src={image.url} alt="" className="w-full block group-hover:opacity-90 transition" />
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition">
              <div className="bg-black/50 rounded-full p-1.5"><ChatIcon /></div>
            </div>
          </div>
        ))}

        {/* 영상 / 음악 */}
        {videos.map((video) => (
          <div
            key={video.id}
            onClick={() => setSelected({ type: 'video', id: video.id, embedUrl: video.embedUrl, platform: video.platform })}
            className="break-inside-avoid mb-[30px] rounded-[1.8px] overflow-hidden relative group cursor-pointer"
          >
            <VideoEmbed embedUrl={video.embedUrl} platform={video.platform} />
            {/* 클릭 캡처 오버레이 */}
            <div className="absolute inset-0" />
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition z-10">
              <div className="bg-black/50 rounded-full p-1.5"><ChatIcon /></div>
            </div>
          </div>
        ))}
      </div>

      {/* ── 모달 ── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null) }}
        >
          <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden flex flex-col md:flex-row w-full max-w-5xl shadow-2xl"
            style={{ maxHeight: '90vh' }}>

            {/* 미디어 영역 */}
            <div className="flex-1 bg-zinc-950 flex items-center justify-center overflow-hidden min-h-0">
              {selected.type === 'image' ? (
                <img
                  src={selected.url}
                  alt=""
                  className="max-w-full object-contain"
                  style={{ maxHeight: '90vh' }}
                />
              ) : (
                <div className="w-full p-4">
                  <VideoEmbed embedUrl={selected.embedUrl} platform={selected.platform} />
                </div>
              )}
            </div>

            {/* 댓글 영역 */}
            <div className="w-full md:w-72 shrink-0 flex flex-col border-t md:border-t-0 md:border-l border-zinc-200 dark:border-zinc-800"
              style={{ maxHeight: '90vh' }}>

              {/* 헤더 */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  댓글{comments.length > 0 && <span className="ml-1.5 text-zinc-400 font-normal">{comments.length}</span>}
                </span>
                <button
                  onClick={() => setSelected(null)}
                  className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition text-lg leading-none"
                >✕</button>
              </div>

              {/* 댓글 목록 */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 min-h-0">
                {loadingComments ? (
                  <p className="text-sm text-zinc-400 dark:text-zinc-500">불러오는 중...</p>
                ) : comments.length > 0 ? (
                  <>
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-2.5 group">
                        {comment.avatarPublicUrl ? (
                          <img src={comment.avatarPublicUrl} alt="" className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-300 shrink-0 mt-0.5">
                            {(comment.username ?? '?')[0].toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-xs font-medium text-zinc-900 dark:text-zinc-50">{comment.username ?? '익명'}</span>
                            <span className="text-xs text-zinc-400 dark:text-zinc-500">{timeAgo(comment.created_at)}</span>
                          </div>
                          <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-0.5 break-words leading-relaxed">{comment.content}</p>
                        </div>
                        {currentUserId === comment.user_id && (
                          <button
                            onClick={() => handleDelete(comment.id)}
                            className="shrink-0 text-xs text-zinc-300 dark:text-zinc-600 hover:text-red-400 dark:hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                          >삭제</button>
                        )}
                      </div>
                    ))}
                    <div ref={commentsEndRef} />
                  </>
                ) : (
                  <p className="text-sm text-zinc-400 dark:text-zinc-500">아직 댓글이 없어요.<br />첫 댓글을 남겨보세요!</p>
                )}
              </div>

              {/* 댓글 입력 */}
              <div className="border-t border-zinc-200 dark:border-zinc-800 p-3 shrink-0">
                {currentUserId ? (
                  <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="댓글을 입력하세요"
                      maxLength={300}
                      className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 transition"
                    />
                    <button
                      type="submit"
                      disabled={submitting || !input.trim()}
                      className="shrink-0 rounded-lg bg-zinc-900 dark:bg-zinc-50 px-3 py-2 text-sm font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-40 transition"
                    >등록</button>
                  </form>
                ) : (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center">
                    <Link href="/login" className="underline text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition">로그인</Link>하고 댓글을 남겨보세요.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
