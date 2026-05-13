import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import ThemeToggle from '@/components/ThemeToggle'

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // 로그인 상태 확인
  const { data: { user } } = await supabase.auth.getUser()

  // 해당 유저 프로필 조회
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', id)
    .single()

  // 본인이면 /profile로 리디렉션
  if (user?.id === id) {
    const { redirect } = await import('next/navigation')
    redirect('/profile')
  }

  // 해당 유저의 공개 보드 조회
  const { data: boards } = await supabase
    .from('moodboards')
    .select('*, moodboard_images(*)')
    .eq('user_id', id)
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  // 보드도 없고 프로필도 없으면 404
  if (!profile && (!boards || boards.length === 0)) notFound()

  const displayName = profile?.username || '익명'
  const avatarUrl = profile?.avatar_url
    ? supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl
    : null

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">

      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition">
            ← 홈으로 돌아가기
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">moodboard</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">

        {/* 프로필 정보 */}
        <div className="flex items-center gap-4 mb-10">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-zinc-900 dark:bg-zinc-50 flex items-center justify-center text-white dark:text-zinc-900 text-2xl font-bold select-none shrink-0">
              {displayName[0].toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{displayName}</h1>
            <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5">
              공개 무드보드 {boards?.length ?? 0}개
            </p>
          </div>
        </div>

        {/* 공개 보드 그리드 */}
        {boards && boards.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {boards.map((board) => {
              const images = (board.moodboard_images as { storage_path: string; order_index: number }[])
                .sort((a, b) => a.order_index - b.order_index)
              const firstImage = images?.[0]
              const thumbnailUrl = firstImage
                ? supabase.storage.from('moodboard-images').getPublicUrl(firstImage.storage_path).data.publicUrl
                : null

              return (
                <Link
                  key={board.id}
                  href={`/boards/${board.id}`}
                  className="group rounded-[1.8px] overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:shadow-md dark:hover:shadow-zinc-900 transition"
                >
                  <div className="aspect-square bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt={board.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-300 dark:text-zinc-600 text-3xl">
                        🖼
                      </div>
                    )}
                  </div>
                  <div className="px-3 py-2.5">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">{board.title}</p>
                    {board.description && (
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">{board.description}</p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <p className="text-center text-zinc-400 dark:text-zinc-500 py-20">
            공개된 무드보드가 없어요.
          </p>
        )}

      </main>
    </div>
  )
}
