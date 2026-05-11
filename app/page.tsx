import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 gap-6">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">moodboard</h1>
      <p className="text-zinc-500 dark:text-zinc-400 text-lg">나만의 무드보드를 만들고 공유해보세요</p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="rounded-lg bg-zinc-900 dark:bg-zinc-50 px-5 py-2.5 text-sm font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition"
        >
          로그인
        </Link>
        <Link
          href="/signup"
          className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          회원가입
        </Link>
      </div>
    </div>
  )
}
