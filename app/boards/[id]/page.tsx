import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import ThemeToggle from '@/components/ThemeToggle'
import DeleteBoardButton from './DeleteBoardButton'
import EditBoardButton from './EditBoardButton'
import VideoEmbed from '@/components/VideoEmbed'

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: board } = await supabase
    .from('moodboards')
    .select('*, moodboard_images(*), moodboard_videos(*)')
    .eq('id', id)
    .single()

  if (!board) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  // 이미지 목록 (order_index 순)
  const images = (board.moodboard_images as { id: string; storage_path: string; order_index: number }[])
    .sort((a, b) => a.order_index - b.order_index)
    .map((img) => {
      const { data } = supabase.storage.from('moodboard-images').getPublicUrl(img.storage_path)
      return { id: img.id, url: data.publicUrl, path: img.storage_path }
    })

  // 영상 목록 (order_index 순)
  const videos = (board.moodboard_videos as {
    id: string
    embed_url: string
    order_index: number
  }[]).sort((a, b) => a.order_index - b.order_index)

  const createdAt = new Date(board.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  const isOwner = user?.id === board.user_id
  const totalItems = images.length + videos.length

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 py-12">

        {/* 상단 네비게이션 */}
        <div className="flex items-center justify-between mb-10">
          <Link href="/profile" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition">
            ← 프로필로 돌아가기
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">moodboard</span>
          </div>
        </div>

        {/* 제목 / 설명 / 버튼 */}
        <div className="flex items-start justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{board.title}</h1>
            {board.description && (
              <p className="mt-2 text-zinc-500 dark:text-zinc-400 text-base">{board.description}</p>
            )}
            <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
              {createdAt} · 이미지 {images.length}장 {videos.length > 0 && `· 영상 ${videos.length}개`}
            </p>
          </div>
          {isOwner && (
            <div className="shrink-0 mt-1 flex items-center gap-2">
              <EditBoardButton boardId={board.id} />
              <DeleteBoardButton boardId={board.id} imagePaths={images.map((img) => img.path)} />
            </div>
          )}
        </div>

        {/* 이미지 + 영상 벽돌형 그리드 */}
        {totalItems > 0 ? (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3">
            {/* 이미지 */}
            {images.map((image) => (
              <div key={image.id} className="break-inside-avoid mb-3 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                <img src={image.url} alt="" className="w-full block hover:opacity-95 transition" />
              </div>
            ))}
            {/* 영상 */}
            {videos.map((video) => {
              const platform = video.embed_url.includes('youtube')
                ? 'youtube'
                : video.embed_url.includes('vimeo')
                ? 'vimeo'
                : video.embed_url.includes('spotify')
                ? 'spotify'
                : 'soundcloud'
              return (
                <VideoEmbed
                  key={video.id}
                  embedUrl={video.embed_url}
                  platform={platform}
                />
              )
            })}
          </div>
        ) : (
          <p className="text-center text-zinc-400 dark:text-zinc-500 py-20">아직 콘텐츠가 없어요.</p>
        )}

      </div>
    </div>
  )
}
