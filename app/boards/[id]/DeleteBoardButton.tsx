'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

interface Props {
  boardId: string
  imagePaths: string[]  // Storage에서 삭제할 파일 경로 목록
}

export default function DeleteBoardButton({ boardId, imagePaths }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)      // 팝업 열림 여부
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setLoading(true)
    setError('')
    const supabase = createClient()

    // 1. Storage에서 이미지 파일 삭제
    if (imagePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('moodboard-images')
        .remove(imagePaths)
      if (storageError) {
        setError('이미지 삭제에 실패했어요: ' + storageError.message)
        setLoading(false)
        return
      }
    }

    // 2. DB에서 무드보드 삭제 (이미지 레코드는 cascade로 자동 삭제)
    const { error: dbError } = await supabase
      .from('moodboards')
      .delete()
      .eq('id', boardId)

    if (dbError) {
      setError('삭제에 실패했어요: ' + dbError.message)
      setLoading(false)
      return
    }

    // 3. 프로필 페이지로 이동
    router.push('/profile')
    router.refresh()
  }

  return (
    <>
      {/* 삭제 버튼 */}
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-red-200 dark:border-red-900 px-3 py-1.5 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition"
      >
        삭제
      </button>

      {/* 확인 팝업 (모달) */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 어두운 배경 */}
          <div
            className="absolute inset-0 bg-black/50 dark:bg-black/70"
            onClick={() => !loading && setOpen(false)}
          />

          {/* 팝업 카드 */}
          <div className="relative z-10 w-full max-w-sm mx-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xl">
            {/* 아이콘 */}
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </div>

            <h2 className="text-center text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              무드보드를 삭제할까요?
            </h2>
            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              삭제하면 모든 이미지가 함께 사라지며,<br />되돌릴 수 없어요.
            </p>

            {/* 에러 메시지 */}
            {error && (
              <p className="mb-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-600 dark:text-red-400 text-center">
                {error}
              </p>
            )}

            {/* 버튼 */}
            <div className="flex gap-2">
              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 rounded-lg bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition"
              >
                {loading ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
