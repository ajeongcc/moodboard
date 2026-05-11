'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
    } else {
      setMessage('가입 완료! 이메일을 확인해서 인증 링크를 클릭해 주세요.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
        {/* 로고 / 타이틀 */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-zinc-900">moodboard</h1>
          <p className="mt-2 text-sm text-zinc-500">새 계정 만들기</p>
        </div>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상"
              className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 transition"
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-600">
              {error}
            </p>
          )}

          {/* 성공 메시지 */}
          {message && (
            <p className="rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700">
              {message}
            </p>
          )}

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 transition"
          >
            {loading ? '처리 중...' : '회원가입'}
          </button>
        </form>

        {/* 로그인 링크 */}
        <p className="mt-6 text-center text-sm text-zinc-500">
          이미 계정이 있나요?{' '}
          <Link href="/login" className="font-medium text-zinc-900 hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
