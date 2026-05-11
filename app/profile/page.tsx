import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import LogoutButton from './LogoutButton'

export default async function ProfilePage() {
  const supabase = await createClient()

  // 현재 로그인된 사용자 정보 가져오기
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 로그인 안 된 경우 → 로그인 페이지로 이동
  if (!user) {
    redirect('/login')
  }

  // 가입일 포맷
  const joinedAt = new Date(user.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-zinc-900">moodboard</h1>
          <LogoutButton />
        </div>

        {/* 프로필 영역 */}
        <div className="flex flex-col items-center gap-4">
          {/* 아바타 */}
          <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center text-white text-3xl font-bold select-none">
            {user.email?.[0].toUpperCase()}
          </div>

          {/* 이메일 */}
          <div className="text-center">
            <p className="text-lg font-semibold text-zinc-900">{user.email}</p>
            <p className="mt-1 text-sm text-zinc-500">가입일: {joinedAt}</p>
          </div>
        </div>

        {/* 구분선 */}
        <hr className="my-6 border-zinc-100" />

        {/* 안내 문구 */}
        <p className="text-center text-sm text-zinc-400">
          무드보드 기능은 곧 추가될 예정이에요 ✨
        </p>
      </div>
    </div>
  )
}
