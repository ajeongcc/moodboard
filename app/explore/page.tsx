import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import ThemeToggle from '@/components/ThemeToggle'
import SearchInput from './SearchInput'

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let boards: {
    id: string
    title: string
    description: string | null
    user_id: string
    created_at: string
    moodboard_images: { storage_path: string; order_index: number }[]
  }[] = []

  let matchingProfiles: { id: string; username: string | null; avatar_url: string | null }[] = []

  if (query) {
    // 제목으로 보드 검색
    const { data: boardsByTitle } = await supabase
      .from('moodboards')
      .select('*, moodboard_images(*)')
      .eq('is_public', true)
      .ilike('title', `%${query}%`)
      .order('created_at', { ascending: false })

    // 닉네임으로 유저 검색
    const { data: profileResults } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .ilike('username', `%${query}%`)

    matchingProfiles = profileResults ?? []

    // 닉네임 매칭 유저의 보드 검색
    const matchingUserIds = matchingProfiles.map((p) => p.id)
    const { data: boardsByUser } = matchingUserIds.length > 0
      ? await supabase
          .from('moodboards')
          .select('*, moodboard_images(*)')
          .eq('is_public', true)
          .in('user_id', matchingUserIds)
          .order('created_at', { ascending: false })
      : { data: [] }

    // 합치고 중복 제거
    const combined = [...(boardsByTitle ?? []), ...(boardsByUser ?? [])]
    boards = combined.filter(
      (board, index, self) => index === self.findIndex((b) => b.id === board.id)
    )
  } else {
    // 검색어 없으면 최신 공개 보드 전체
    const { data: allBoards } = await supabase
      .from('moodboards')
      .select('*, moodboard_images(*)')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
    boards = allBoards ?? []
  }

  // 작성자 프로필 조회
  const userIds = [...new Set(boards.map((b) => b.user_id))]
  const { data: profiles } = userIds.length > 0
    ? await supabase.from('profiles').select('id, username, avatar_url').in('id', userIds)
    : { data: [] }

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">

      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            moodboard
          </Link>
          <div className="flex items-center gap-2">
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
                <Link href="/login" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition px-2">
                  로그인
                </Link>
                <Link href="/signup" className="rounded-lg bg-zinc-900 dark:bg-zinc-50 px-4 py-1.5 text-sm font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition">
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">

        {/* 검색창 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">탐색</h2>
          <SearchInput defaultValue={query} />
        </div>

        {/* 닉네임 검색 결과 - 유저 칩 */}
        {query && matchingProfiles.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-3">
              사용자
            </p>
            <div className="flex flex-wrap gap-2">
              {matchingProfiles.map((profile) => {
                const avatarUrl = profile.avatar_url
                  ? supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl
                  : null
                return (
                  <Link
                    key={profile.id}
                    href={`/users/${profile.id}`}
                    className="flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 hover:shadow-sm transition"
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 text-xs font-bold">
                        {(profile.username ?? '?')[0].toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      {profile.username ?? '익명'}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* 결과 타이틀 */}
        <div className="mb-5">
          <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1">
            {query ? '무드보드' : '전체 무드보드'}
          </p>
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            {query
              ? `"${query}" 검색 결과 ${boards.length}개`
              : `${boards.length}개의 무드보드`}
          </p>
        </div>

        {/* 보드 그리드 */}
        {boards.length > 0 ? (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-[30px]">
            {boards.map((board) => {
              const images = board.moodboard_images
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
          <div className="flex flex-col items-center justify-center py-32 gap-2 text-center">
            <p className="text-zinc-400 dark:text-zinc-500">
              {query ? `"${query}"에 대한 결과가 없어요.` : '아직 공개된 무드보드가 없어요.'}
            </p>
          </div>
        )}

      </main>
    </div>
  )
}
