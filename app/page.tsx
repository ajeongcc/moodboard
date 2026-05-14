import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import ThemeToggle from '@/components/ThemeToggle'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 로그인한 사용자는 탐색 페이지로 바로 이동
  if (user) redirect('/explore')

  return (
    <div className="min-h-screen bg-black flex flex-col">

      {/* 헤더 */}
      <header className="flex items-center justify-between px-8 sm:px-12 py-7">
        <span className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-600">
          moodboard
        </span>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link
            href="/login"
            className="text-sm text-zinc-500 hover:text-white transition"
          >
            로그인 →
          </Link>
        </div>
      </header>

      {/* 메인 */}
      <main className="flex-1 flex flex-col justify-center px-8 sm:px-12 pb-16">

        {/* 대형 제목 */}
        <h1 className="text-[18vw] sm:text-[14vw] lg:text-[11vw] font-bold leading-[0.88] tracking-tight text-white mb-10 sm:mb-16">
          mood<br />board
        </h1>

        {/* 소개 + 버튼 */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-10 sm:gap-20">
          <p className="text-sm text-zinc-500 leading-loose max-w-xs">
            영감을 수집하고,<br />
            나만의 무드보드를 만들고,<br />
            세상과 공유하세요.
          </p>

          <div className="flex flex-col gap-3">
            {/* 유리 버튼 — 메인 */}
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-full px-8 py-3 text-sm font-semibold text-white transition hover:brightness-125"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.07) 100%)',
                border: '1px solid rgba(255,255,255,0.28)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.35)',
                backdropFilter: 'blur(12px)',
              }}
            >
              계정 만들기
            </Link>

            {/* 유리 버튼 — 서브 */}
            <Link
              href="/explore"
              className="inline-flex items-center justify-center rounded-full px-8 py-3 text-sm font-semibold text-zinc-300 transition hover:brightness-125"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)',
                border: '1px solid rgba(255,255,255,0.13)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
                backdropFilter: 'blur(12px)',
              }}
            >
              탐색하기
            </Link>
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="flex items-center justify-between px-8 sm:px-12 py-7 border-t border-zinc-900">
        <p className="text-xs text-zinc-700">© 2026 moodboard</p>
        <Link
          href="/explore"
          className="text-xs text-zinc-700 hover:text-zinc-400 transition"
        >
          모든 무드보드 보기 →
        </Link>
      </footer>

    </div>
  )
}
