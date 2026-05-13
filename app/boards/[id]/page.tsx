import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import ThemeToggle from '@/components/ThemeToggle'
import DeleteBoardButton from './DeleteBoardButton'
import EditBoardButton from './EditBoardButton'
import LikeButton from './LikeButton'
import CommentSection from './CommentSection'
import MediaGrid from './MediaGrid'
import { type MediaPlatform } from '@/utils/parseVideoUrl'

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: board } = await supabase
    .from('moodboards')
    .select('*, moodboard_images(*), moodboard_videos(*)')
    .eq('id', id)
    .single()

  if (!board) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  // 비공개 보드는 본인만 접근 가능
  if (!board.is_public && user?.id !== board.user_id) notFound()

  // 이미지 목록 (order_index 순)
  const images = (board.moodboard_images as { id: string; storage_path: string; order_index: number }[])
    .sort((a, b) => a.order_index - b.order_index)
    .map((img) => {
      const { data } = supabase.storage.from('moodboard-images').getPublicUrl(img.storage_path)
      return { id: img.id, url: data.publicUrl, path: img.storage_path }
    })

  // 영상 목록 (order_index 순, platform 포함)
  const videos = (board.moodboard_videos as {
    id: string
    embed_url: string
    order_index: number
  }[])
    .sort((a, b) => a.order_index - b.order_index)
    .map((v) => {
      const platform: MediaPlatform = v.embed_url.includes('youtube')
        ? 'youtube'
        : v.embed_url.includes('vimeo')
        ? 'vimeo'
        : v.embed_url.includes('spotify')
        ? 'spotify'
        : v.embed_url.includes('apple')
        ? 'applemusic'
        : 'soundcloud'
      return { id: v.id, embedUrl: v.embed_url, platform }
    })

  const createdAt = new Date(board.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  // 작성자 프로필 조회
  const { data: authorProfile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', board.user_id)
    .single()

  const authorName = authorProfile?.username || '익명'
  const authorAvatarUrl = authorProfile?.avatar_url
    ? supabase.storage.from('avatars').getPublicUrl(authorProfile.avatar_url).data.publicUrl
    : null

  // 좋아요 수 조회
  const { count: likeCount } = await supabase
    .from('board_likes')
    .select('*', { count: 'exact', head: true })
    .eq('board_id', id)

  // 현재 유저의 좋아요 여부
  const { data: userLike } = user
    ? await supabase
        .from('board_likes')
        .select('id')
        .eq('board_id', id)
        .eq('user_id', user.id)
        .maybeSingle()
    : { data: null }

  // 댓글 조회
  const { data: rawComments } = await supabase
    .from('board_comments')
    .select('*')
    .eq('board_id', id)
    .order('created_at', { ascending: true })

  // 댓글 작성자 프로필 조회
  const commenterIds = [...new Set((rawComments ?? []).map((c) => c.user_id))]
  const { data: commenterProfiles } = commenterIds.length > 0
    ? await supabase.from('profiles').select('id, username, avatar_url').in('id', commenterIds)
    : { data: [] }

  const commenterMap = Object.fromEntries((commenterProfiles ?? []).map((p) => [p.id, p]))

  const comments = (rawComments ?? []).map((c) => {
    const profile = commenterMap[c.user_id]
    const avatarPublicUrl = profile?.avatar_url
      ? supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl
      : null
    return {
      id: c.id,
      user_id: c.user_id,
      content: c.content,
      created_at: c.created_at,
      username: profile?.username ?? null,
      avatarPublicUrl,
    }
  })

  const isOwner = user?.id === board.user_id
  const totalItems = images.length + videos.length

  const videoCount = videos.filter((v) => v.platform === 'youtube' || v.platform === 'vimeo').length
  const musicCount = videos.filter((v) => v.platform === 'spotify' || v.platform === 'applemusic' || v.platform === 'soundcloud').length

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 py-12">

        {/* 상단 네비게이션 */}
        <div className="flex items-center justify-between mb-10">
          <Link href="/" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition">
            ← 홈으로 돌아가기
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">moodboard</span>
          </div>
        </div>

        {/* 제목 / 설명 / 버튼 */}
        <div className="flex items-start justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{board.title}</h1>
              {isOwner && (
                <span className={`mt-1 shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${board.is_public ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400' : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'}`}>
                  {board.is_public ? '공개' : '🔒 비공개'}
                </span>
              )}
            </div>
            {board.description && (
              <p className="mt-2 text-zinc-500 dark:text-zinc-400 text-base">{board.description}</p>
            )}
            <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
              {createdAt} · 이미지 {images.length}장{videoCount > 0 && ` · 영상 ${videoCount}개`}{musicCount > 0 && ` · 음악 ${musicCount}개`}
            </p>

            {/* 작성자 프로필 + 좋아요 */}
            <div className="flex items-center gap-3 mt-4">
              <Link
                href={`/users/${board.user_id}`}
                className="inline-flex items-center gap-2 group"
              >
                {authorAvatarUrl ? (
                  <img src={authorAvatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 text-xs font-bold">
                    {authorName[0].toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-50 transition">
                  {authorName}
                </span>
              </Link>
              <LikeButton
                boardId={board.id}
                initialLiked={!!userLike}
                initialCount={likeCount ?? 0}
                userId={user?.id ?? null}
              />
            </div>
          </div>
          {isOwner && (
            <div className="shrink-0 mt-1 flex items-center gap-2">
              <EditBoardButton boardId={board.id} />
              <DeleteBoardButton boardId={board.id} imagePaths={images.map((img) => img.path)} />
            </div>
          )}
        </div>

        {/* 이미지 + 영상 벽돌형 그리드 (클릭 시 댓글 모달) */}
        <MediaGrid
          images={images}
          videos={videos}
          boardId={board.id}
          currentUserId={user?.id ?? null}
        />

        {/* 댓글 섹션 */}
        <CommentSection
          boardId={board.id}
          initialComments={comments}
          currentUserId={user?.id ?? null}
        />

      </div>
    </div>
  )
}
