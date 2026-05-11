import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 gap-6">
      <h1 className="text-4xl font-bold text-zinc-900">moodboard</h1>
      <p className="text-zinc-500 text-lg">나만의 무드보드를 만들고 공유해보세요</p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 transition"
        >
          로그인
        </Link>
        <Link
          href="/signup"
          className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 transition"
        >
          회원가입
        </Link>
      </div>
    </div>
  )
}
