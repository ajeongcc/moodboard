'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

export default function NewBoardPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 이미지 파일 선택 시 미리보기 생성
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || [])
    if (selected.length === 0) return

    setFiles((prev) => [...prev, ...selected])
    const newPreviews = selected.map((f) => URL.createObjectURL(f))
    setPreviews((prev) => [...prev, ...newPreviews])

    // 같은 파일 다시 선택할 수 있도록 초기화
    e.target.value = ''
  }

  // 이미지 제거
  function removeImage(index: number) {
    URL.revokeObjectURL(previews[index])
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  // 폼 제출
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (files.length === 0) {
      setError('이미지를 한 장 이상 추가해주세요.')
      return
    }
    setError('')
    setLoading(true)

    const supabase = createClient()

    // 로그인 확인
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // 1. 무드보드 생성
    const { data: board, error: boardError } = await supabase
      .from('moodboards')
      .insert({ user_id: user.id, title, description })
      .select()
      .single()

    if (boardError || !board) {
      setError('무드보드 생성에 실패했어요: ' + boardError?.message)
      setLoading(false)
      return
    }

    // 2. 이미지 업로드 + DB 저장
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${board.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('moodboard-images')
        .upload(path, file)

      if (uploadError) {
        setError('이미지 업로드에 실패했어요: ' + uploadError.message)
        setLoading(false)
        return
      }

      await supabase
        .from('moodboard_images')
        .insert({ moodboard_id: board.id, storage_path: path })
    }

    router.push(`/boards/${board.id}`)
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-2xl mx-auto px-4 py-12">

        {/* 상단 네비게이션 */}
        <div className="flex items-center justify-between mb-10">
          <Link href="/profile" className="text-sm text-zinc-500 hover:text-zinc-900 transition">
            ← 프로필로 돌아가기
          </Link>
          <span className="text-lg font-bold text-zinc-900">moodboard</span>
        </div>

        <h1 className="text-2xl font-bold text-zinc-900 mb-8">새 무드보드 만들기</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* 제목 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">제목</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="무드보드 제목을 입력하세요"
              className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 transition"
            />
          </div>

          {/* 설명 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">
              설명 <span className="text-zinc-400 font-normal">(선택)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="어떤 분위기의 무드보드인지 설명해보세요"
              rows={3}
              className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 transition resize-none"
            />
          </div>

          {/* 이미지 업로드 */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-zinc-700">이미지</label>

            {/* 미리보기 — 벽돌형 그리드 */}
            {previews.length > 0 && (
              <div className="columns-2 sm:columns-3 gap-2">
                {previews.map((src, i) => (
                  <div
                    key={i}
                    className="break-inside-avoid mb-2 relative group rounded-xl overflow-hidden bg-zinc-100"
                  >
                    <img src={src} alt="" className="w-full block" />
                    {/* 삭제 버튼 */}
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      aria-label="이미지 삭제"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 이미지 추가 버튼 */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 px-4 py-8 text-sm text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 transition"
            >
              <span className="text-xl">+</span>
              <span>이미지 추가하기</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
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
            className="rounded-lg bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 transition"
          >
            {loading ? '저장 중...' : '무드보드 만들기'}
          </button>

        </form>
      </div>
    </div>
  )
}
