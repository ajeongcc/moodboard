import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import LogoutButton from './LogoutButton'
import ThemeToggle from '@/components/ThemeToggle'

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user.id)
    .single()

  const { data: boards } = await supabase
    .from('moodboards')
    .select('*, moodboard_images(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const joinedAt = new Date(user.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const displayName = profile?.username || user.email

  let avatarUrl: string | null = null
  if (profile?.avatar_url) {
    avatarUrl = supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* 상단 헤더 */}
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">moodboard</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>

        {/* 프로필 카드 */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex items-center gap-5 mb-10">
          {/* 아바타 */}
          <div className="shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="프로필 사진"
                className="w-14 h-14 rounded-full object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-zinc-900 dark:bg-zinc-50 flex items-center justify-center text-white dark:text-zinc-900 text-2xl font-bold select-none">
                {user.email?.[0].toUpperCase()}
              </div>
            )}
          </div>
          {/* 이름 / 이메일 */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-zinc-900 dark:text-zinc-50 truncate">{displayName}</p>
            {profile?.username && (
              <p className="text-sm text-zinc-400 dark:text-zinc-500 truncate">{user.email}</p>
            )}
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">가입일: {joinedAt}</p>
          </div>
          {/* 편집 버튼 */}
          <Link
            href="/profile/edit"
            className="shrink-0 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
          >
            편집
          </Link>
        </div>

        {/* 내 무드보드 섹션 */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            내 무드보드 <span className="text-zinc-400 dark:text-zinc-500 font-normal text-base">({boards?.length ?? 0})</span>
          </h2>
          <Link
            href="/boards/new"
            className="rounded-lg bg-zinc-900 dark:bg-zinc-50 px-4 py-2 text-sm font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition"
          >
            + 새 무드보드
          </Link>
        </div>

        {/* 무드보드 그리드 */}
        {boards && boards.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {boards.map((board) => {
              const firstImage = (board.moodboard_images as { storage_path: string }[])?.[0]
              const thumbnailUrl = firstImage
                ? supabase.storage.from('moodboard-images').getPublicUrl(firstImage.storage_path).data.publicUrl
                : null

              return (
                <Link
                  key={board.id}
                  href={`/boards/${board.id}`}
                  className="group rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:shadow-md dark:hover:shadow-zinc-900 transition"
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
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                      이미지 {(board.moodboard_images as unknown[]).length}장
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <p className="text-zinc-400 dark:text-zinc-500">아직 만든 무드보드가 없어요.</p>
            <Link
              href="/boards/new"
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              첫 무드보드 만들기
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
