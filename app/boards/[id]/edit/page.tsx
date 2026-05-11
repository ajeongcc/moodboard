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

  // 로그인 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 무드보드 + 이미지 가져오기
  const { data: board } = await supabase
    .from('moodboards')
    .select('*, moodboard_images(*)')
    .eq('id', id)
    .single()

  if (!board) notFound()

  // 본인 보드가 아니면 보드 뷰로 리다이렉트
  if (board.user_id !== user.id) redirect(`/boards/${id}`)

  // 이미지 목록 (order_index 순으로 정렬)
  const images = (board.moodboard_images as { id: string; storage_path: string; order_index: number }[])
    .sort((a, b) => a.order_index - b.order_index)
    .map((img) => {
      const { data } = supabase.storage
        .from('moodboard-images')
        .getPublicUrl(img.storage_path)
      return { id: img.id, url: data.publicUrl, path: img.storage_path }
    })

  return (
    <EditBoardForm
      boardId={id}
      initialTitle={board.title}
      initialDescription={board.description ?? ''}
      initialImages={images}
    />
  )
}
