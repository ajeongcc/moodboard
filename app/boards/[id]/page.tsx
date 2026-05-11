import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // 무드보드 정보 + 이미지 목록 한 번에 가져오기
  const { data: board } = await supabase
    .from('moodboards')
    .select('*, moodboard_images(*)')
    .eq('id', id)
    .single()

  if (!board) notFound()

  // 각 이미지의 공개 URL 생성
  const images = (board.moodboard_images as { id: string; storage_path: string }[]).map(
    (img) => {
      const { data } = supabase.storage
        .from('moodboard-images')
        .getPublicUrl(img.storage_path)
      return { id: img.id, url: data.publicUrl }
    }
  )

  // 가입일 포맷
  const createdAt = new Date(board.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto px-4 py-12">

        {/* 상단 네비게이션 */}
        <div className="flex items-center justify-between mb-10">
          <Link href="/profile" className="text-sm text-zinc-500 hover:text-zinc-900 transition">
            ← 프로필로 돌아가기
          </Link>
          <span className="text-lg font-bold text-zinc-900">moodboard</span>
        </div>

        {/* 무드보드 제목 / 설명 */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-zinc-900">{board.title}</h1>
          {board.description && (
            <p className="mt-2 text-zinc-500 text-base">{board.description}</p>
          )}
          <p className="mt-3 text-xs text-zinc-400">{createdAt} · 이미지 {images.length}장</p>
        </div>

        {/* 벽돌형 그리드 (Masonry Grid) */}
        {images.length > 0 ? (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3">
            {images.map((image) => (
              <div
                key={image.id}
                className="break-inside-avoid mb-3 rounded-xl overflow-hidden bg-zinc-100"
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
          <p className="text-center text-zinc-400 py-20">이미지가 없어요.</p>
        )}

      </div>
    </div>
  )
}
