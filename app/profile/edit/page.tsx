'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import ThemeToggle from '@/components/ThemeToggle'

export default function EditProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [username, setUsername] = useState('')
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null)
  const [avatarPath, setAvatarPath] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState('')

  // 현재 프로필 불러오기
  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single()

      if (profile?.username) setUsername(profile.username)
      if (profile?.avatar_url) {
        setAvatarPath(profile.avatar_url)
        const { data } = supabase.storage.from('avatars').getPublicUrl(profile.avatar_url)
        setCurrentAvatarUrl(data.publicUrl)
      }
      setInitialLoading(false)
    }
    loadProfile()
  }, [router])

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setNewAvatarFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    e.target.value = ''
  }

  async function handleSave() {
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    let newAvatarPath = avatarPath

    // 새 아바타 이미지 업로드
    if (newAvatarFile) {
      const ext = newAvatarFile.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, newAvatarFile, { upsert: true })

      if (uploadError) {
        setError('사진 업로드에 실패했어요: ' + uploadError.message)
        setLoading(false)
        return
      }
      newAvatarPath = path
    }

    // 프로필 upsert
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username: username.trim() || null,
        avatar_url: newAvatarPath,
        updated_at: new Date().toISOString(),
      })

    if (upsertError) {
      setError('저장에 실패했어요: ' + upsertError.message)
      setLoading(false)
      return
    }

    router.push('/profile')
    router.refresh()
  }

  const displayAvatar = previewUrl ?? currentAvatarUrl

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <p className="text-sm text-zinc-400">불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-md mx-auto px-4 py-12">

        {/* 상단 네비게이션 */}
        <div className="flex items-center justify-between mb-10">
          <Link href="/profile" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition">
            ← 프로필로 돌아가기
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">moodboard</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-8">프로필 편집</h1>

        <div className="flex flex-col gap-6">

          {/* 프로필 사진 */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative group"
            >
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt="프로필 사진"
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-zinc-900 dark:bg-zinc-50 flex items-center justify-center text-white dark:text-zinc-900 text-4xl font-bold select-none">
                  ?
                </div>
              )}
              {/* 호버 오버레이 */}
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <span className="text-white text-xs font-medium">변경</span>
              </div>
            </button>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">사진을 클릭해서 변경하세요</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          {/* 닉네임 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">닉네임</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="닉네임을 입력하세요"
              maxLength={30}
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-400/20 transition"
            />
            <p className="text-xs text-zinc-400 dark:text-zinc-500">비워두면 이메일이 표시돼요</p>
          </div>

          {/* 에러 */}
          {error && (
            <p className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          {/* 버튼 */}
          <div className="flex gap-2 pt-2">
            <Link
              href="/profile"
              className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 py-2.5 text-sm font-medium text-center text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
            >
              취소
            </Link>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 rounded-lg bg-zinc-900 dark:bg-zinc-50 py-2.5 text-sm font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-50 transition"
            >
              {loading ? '저장 중...' : '저장하기'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
