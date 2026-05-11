'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
    } else {
      router.push('/profile')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
        {/* 로고 / 타이틀 */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-zinc-900">moodboard</h1>
          <p className="mt-2 text-sm text-zinc-500">계정에 로그인하세요</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          {/* 이메일 */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700">이메일</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 transition"
            />
          </div>

          {/* 비밀번호 */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700">비밀번호</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 transition"
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-600">
              {error}
            </p>
          )}

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 transition"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {/* 회원가입 링크 */}
        <p className="mt-6 text-center text-sm text-zinc-500">
          아직 계정이 없나요?{' '}
          <Link href="/signup" className="font-medium text-zinc-900 hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  )
}
