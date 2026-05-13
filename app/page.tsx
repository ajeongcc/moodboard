import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import ThemeToggle from '@/components/ThemeToggle'

export default async function HomePage() {
  const supabase = await createClient()

  // 로그인 상태 확인
  const { data: { user } } = await supabase.auth.getUser()

  // 공개 무드보드 전체 조회 (최신순)
  const { data: boards } = await supabase
    .from('moodboards')
    .select('*, moodboard_images(*)')
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  // 작성자 프로필 조회
  const userIds = [...new Set((boards ?? []).map((b) => b.user_id))]
  const { data: profiles } = userIds.length > 0
    ? await supabase.from('profiles').select('id, username').in('id', userIds)
    : { data: [] }

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">

      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">moodboard</span>
          <div className="flex items-center gap-2">
            <Link
              href="/explore"
              className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition px-2"
            >
              탐색
            </Link>
            <ThemeToggle />
            {user ? (
              <Link
                href="/profile"
                className="rounded-lg bg-zinc-900 dark:bg-zinc-50 px-4 py-1.5 text-sm font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition"
              >
                내 프로필
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition px-2"
                >
                  로그인
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-zinc-900 dark:bg-zinc-50 px-4 py-1.5 text-sm font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition"
                >
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">

        {/* 타이틀 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">모든 무드보드</h2>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
            {boards?.length ?? 0}개의 무드보드
          </p>
        </div>

        {boards && boards.length > 0 ? (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-[30px]">
            {boards.map((board) => {
              const images = (board.moodboard_images as { storage_path: string; order_index: number }[])
                .sort((a, b) => a.order_index - b.order_index)
              const firstImage = images?.[0]
              const thumbnailUrl = firstImage
                ? supabase.storage.from('moodboard-images').getPublicUrl(firstImage.storage_path).data.publicUrl
                : null
              const profile = profileMap[board.user_id]
              const authorName = profile?.username || '익명'

              return (
                <Link
                  key={board.id}
                  href={`/boards/${board.id}`}
                  className="break-inside-avoid mb-[30px] block group rounded-[1.8px] overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:shadow-md dark:hover:shadow-zinc-900 transition"
                >
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={board.title}
                      className="w-full block group-hover:opacity-95 transition"
                    />
                  ) : (
                    <div className="aspect-square flex items-center justify-center text-zinc-300 dark:text-zinc-600 text-3xl">
                      🖼
                    </div>
                  )}
                  <div className="px-3 py-2.5">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">{board.title}</p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">{authorName}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 gap-3 text-center">
            <p className="text-zinc-400 dark:text-zinc-500">아직 공개된 무드보드가 없어요.</p>
            {user ? (
              <Link
                href="/boards/new"
                className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 underline transition"
              >
                첫 무드보드를 만들어보세요
              </Link>
            ) : (
              <Link
                href="/signup"
                className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 underline transition"
              >
                가입하고 첫 무드보드를 만들어보세요
              </Link>
            )}
          </div>
        )}

      </main>
    </div>
  )
}
