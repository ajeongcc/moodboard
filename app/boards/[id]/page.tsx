import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import ThemeToggle from '@/components/ThemeToggle'
import DeleteBoardButton from './DeleteBoardButton'

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // 무드보드 + 이미지 목록 가져오기
  const { data: board } = await supabase
    .from('moodboards')
    .select('*, moodboard_images(*)')
    .eq('id', id)
    .single()

  if (!board) notFound()

  // 현재 로그인된 사용자
  const { data: { user } } = await supabase.auth.getUser()

  // 이미지 URL + storage 경로 목록
  const images = (board.moodboard_images as { id: string; storage_path: string }[]).map(
    (img) => {
      const { data } = supabase.storage
        .from('moodboard-images')
        .getPublicUrl(img.storage_path)
      return { id: img.id, url: data.publicUrl, path: img.storage_path }
    }
  )

  const createdAt = new Date(board.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // 현재 사용자가 이 보드의 주인인지 확인
  const isOwner = user?.id === board.user_id

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

        {/* 무드보드 제목 / 설명 / 삭제 버튼 */}
        <div className="flex items-start justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{board.title}</h1>
            {board.description && (
              <p className="mt-2 text-zinc-500 dark:text-zinc-400 text-base">{board.description}</p>
            )}
            <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
              {createdAt} · 이미지 {images.length}장
            </p>
          </div>

          {/* 본인 보드일 때만 삭제 버튼 표시 */}
          {isOwner && (
            <div className="shrink-0 mt-1">
              <DeleteBoardButton
                boardId={board.id}
                imagePaths={images.map((img) => img.path)}
              />
            </div>
          )}
        </div>

        {/* 벽돌형 그리드 (Masonry Grid) */}
        {images.length > 0 ? (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3">
            {images.map((image) => (
              <div
                key={image.id}
                className="break-inside-avoid mb-3 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800"
              >
                <img
                  src={image.url}
                  alt=""
                  className="w-full block hover:opacity-95 transition"
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-zinc-400 dark:text-zinc-500 py-20">이미지가 없어요.</p>
        )}

      </div>
    </div>
  )
}
