import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import LogoutButton from './LogoutButton'

export default async function ProfilePage() {
  const supabase = await createClient()

  // 현재 로그인된 사용자 정보 가져오기
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 내 무드보드 목록 가져오기 (최신순, 첫 번째 이미지 포함)
  const { data: boards } = await supabase
    .from('moodboards')
    .select('*, moodboard_images(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // 가입일 포맷
  const joinedAt = new Date(user.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* 상단 헤더 */}
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-2xl font-bold text-zinc-900">moodboard</h1>
          <LogoutButton />
        </div>

        {/* 프로필 카드 */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 flex items-center gap-5 mb-10">
          <div className="w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center text-white text-2xl font-bold select-none shrink-0">
            {user.email?.[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-zinc-900">{user.email}</p>
            <p className="text-sm text-zinc-400 mt-0.5">가입일: {joinedAt}</p>
          </div>
        </div>

        {/* 내 무드보드 섹션 */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-zinc-900">
            내 무드보드 <span className="text-zinc-400 font-normal text-base">({boards?.length ?? 0})</span>
          </h2>
          <Link
            href="/boards/new"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 transition"
          >
            + 새 무드보드
          </Link>
        </div>

        {/* 무드보드 그리드 */}
        {boards && boards.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {boards.map((board) => {
              // 첫 번째 이미지 썸네일 URL
              const firstImage = (board.moodboard_images as { storage_path: string }[])?.[0]
              const thumbnailUrl = firstImage
                ? supabase.storage.from('moodboard-images').getPublicUrl(firstImage.storage_path).data.publicUrl
                : null

              return (
                <Link
                  key={board.id}
                  href={`/boards/${board.id}`}
                  className="group rounded-xl overflow-hidden border border-zinc-200 bg-white hover:shadow-md transition"
                >
                  {/* 썸네일 */}
                  <div className="aspect-square bg-zinc-100 overflow-hidden">
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt={board.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-300 text-3xl">
                        🖼
                      </div>
                    )}
                  </div>
                  {/* 제목 */}
                  <div className="px-3 py-2.5">
                    <p className="text-sm font-medium text-zinc-900 truncate">{board.title}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      이미지 {(board.moodboard_images as unknown[]).length}장
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          /* 무드보드가 없을 때 */
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <p className="text-zinc-400">아직 만든 무드보드가 없어요.</p>
            <Link
              href="/boards/new"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 transition"
            >
              첫 무드보드 만들기
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
