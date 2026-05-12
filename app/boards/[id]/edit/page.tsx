import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import EditBoardForm from './EditBoardForm'

export default async function EditBoardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: board } = await supabase
    .from('moodboards')
    .select('*, moodboard_images(*), moodboard_videos(*)')
    .eq('id', id)
    .single()

  if (!board) notFound()
  if (board.user_id !== user.id) redirect(`/boards/${id}`)

  // 이미지 목록 (order_index 순)
  const images = (board.moodboard_images as { id: string; storage_path: string; order_index: number }[])
    .sort((a, b) => a.order_index - b.order_index)
    .map((img) => {
      const { data } = supabase.storage.from('moodboard-images').getPublicUrl(img.storage_path)
      return { id: img.id, url: data.publicUrl, path: img.storage_path }
    })

  // 영상 목록 (order_index 순)
  const videos = (board.moodboard_videos as {
    id: string
    embed_url: string
    original_url: string
    order_index: number
  }[])
    .sort((a, b) => a.order_index - b.order_index)
    .map((v) => {
      const platform = v.embed_url.includes('youtube')
        ? 'youtube'
        : v.embed_url.includes('vimeo')
        ? 'vimeo'
        : v.embed_url.includes('spotify')
        ? 'spotify'
        : 'soundcloud'
      const videoId = platform === 'youtube'
        ? v.embed_url.split('/embed/')[1]
        : platform === 'vimeo'
        ? v.embed_url.split('/video/')[1]
        : v.original_url  // SoundCloud는 원본 URL을 videoId로 사용
      return {
        id: v.id,
        embedUrl: v.embed_url,
        originalUrl: v.original_url,
        platform: platform as 'youtube' | 'vimeo',
        videoId,
      }
    })

  return (
    <EditBoardForm
      boardId={id}
      initialTitle={board.title}
      initialDescription={board.description ?? ''}
      initialImages={images}
      initialVideos={videos}
    />
  )
}
