'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createClient } from '@/utils/supabase/client'
import ThemeToggle from '@/components/ThemeToggle'

// ─── 타입 ────────────────────────────────────────────────────
interface ExistingImage {
  id: string
  url: string
  path: string
}

interface NewImage {
  tempId: string
  file: File
  preview: string
}

interface Props {
  boardId: string
  initialTitle: string
  initialDescription: string
  initialImages: ExistingImage[]
}

// ─── 드래그 가능한 기존 이미지 카드 ─────────────────────────
function SortableImage({
  image,
  onRemove,
}: {
  image: ExistingImage
  onRemove: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: image.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 aspect-square">
      {/* 드래그 핸들 + 이미지 */}
      <div
        {...attributes}
        {...listeners}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <img src={image.url} alt="" className="w-full h-full object-cover" />
      </div>

      {/* 삭제 버튼 */}
      <button
        type="button"
        onClick={() => onRemove(image.id)}
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
        aria-label="이미지 삭제"
      >
        ✕
      </button>

      {/* 드래그 힌트 아이콘 */}
      <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-60 transition pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white">
          <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
          <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
          <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
        </svg>
      </div>
    </div>
  )
}

// ─── 새로 추가된 이미지 카드 (드래그 없음) ───────────────────
function NewImageCard({
  image,
  onRemove,
}: {
  image: NewImage
  onRemove: (tempId: string) => void
}) {
  return (
    <div className="relative group rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 aspect-square">
      <img src={image.preview} alt="" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
        <span className="text-white text-xs font-medium bg-black/40 px-2 py-0.5 rounded-full">새 이미지</span>
      </div>
      <button
        type="button"
        onClick={() => onRemove(image.tempId)}
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
        aria-label="이미지 삭제"
      >
        ✕
      </button>
    </div>
  )
}

// ─── 메인 편집 폼 ─────────────────────────────────────────────
export default function EditBoardForm({ boardId, initialTitle, initialDescription, initialImages }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [existingImages, setExistingImages] = useState<ExistingImage[]>(initialImages)
  const [deletedIds, setDeletedIds] = useState<string[]>([])   // DB에서 삭제할 이미지 id
  const [deletedPaths, setDeletedPaths] = useState<string[]>([]) // Storage에서 삭제할 경로
  const [newImages, setNewImages] = useState<NewImage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 드래그 센서 설정 (마우스 + 터치 지원)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  // 드래그 끝났을 때 순서 업데이트
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setExistingImages((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === active.id)
      const newIndex = prev.findIndex((i) => i.id === over.id)
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  // 기존 이미지 삭제 표시
  function handleRemoveExisting(id: string) {
    const image = existingImages.find((i) => i.id === id)
    if (!image) return
    setExistingImages((prev) => prev.filter((i) => i.id !== id))
    setDeletedIds((prev) => [...prev, id])
    setDeletedPaths((prev) => [...prev, image.path])
  }

  // 새 이미지 추가
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    const added = files.map((file) => ({
      tempId: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      preview: URL.createObjectURL(file),
    }))
    setNewImages((prev) => [...prev, ...added])
    e.target.value = ''
  }

  // 새 이미지 제거
  function handleRemoveNew(tempId: string) {
    setNewImages((prev) => {
      const target = prev.find((i) => i.tempId === tempId)
      if (target) URL.revokeObjectURL(target.preview)
      return prev.filter((i) => i.tempId !== tempId)
    })
  }

  // 저장
  async function handleSave() {
    if (existingImages.length === 0 && newImages.length === 0) {
      setError('이미지를 한 장 이상 남겨주세요.')
      return
    }
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // 1. 제목 / 설명 업데이트
    const { error: updateError } = await supabase
      .from('moodboards')
      .update({ title, description })
      .eq('id', boardId)
    if (updateError) { setError('저장 실패: ' + updateError.message); setLoading(false); return }

    // 2. 삭제할 이미지 처리
    if (deletedPaths.length > 0) {
      await supabase.storage.from('moodboard-images').remove(deletedPaths)
    }
    if (deletedIds.length > 0) {
      await supabase.from('moodboard_images').delete().in('id', deletedIds)
    }

    // 3. 기존 이미지 순서 저장
    for (let i = 0; i < existingImages.length; i++) {
      await supabase
        .from('moodboard_images')
        .update({ order_index: i })
        .eq('id', existingImages[i].id)
    }

    // 4. 새 이미지 업로드 + DB 저장
    let orderOffset = existingImages.length
    for (const newImg of newImages) {
      const ext = newImg.file.name.split('.').pop()
      const path = `${user.id}/${boardId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('moodboard-images')
        .upload(path, newImg.file)
      if (uploadError) { setError('이미지 업로드 실패: ' + uploadError.message); setLoading(false); return }
      await supabase.from('moodboard_images').insert({ moodboard_id: boardId, storage_path: path, order_index: orderOffset })
      orderOffset++
    }

    router.push(`/boards/${boardId}`)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* 상단 네비게이션 */}
        <div className="flex items-center justify-between mb-10">
          <Link href={`/boards/${boardId}`} className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition">
            ← 돌아가기
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">moodboard</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-8">무드보드 편집</h1>

        <div className="flex flex-col gap-6">

          {/* 제목 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-400/20 transition"
            />
          </div>

          {/* 설명 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              설명 <span className="text-zinc-400 dark:text-zinc-500 font-normal">(선택)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="어떤 분위기의 무드보드인지 설명해보세요"
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-400/20 transition resize-none"
            />
          </div>

          {/* 이미지 섹션 */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">이미지</label>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">드래그해서 순서를 바꿀 수 있어요</span>
            </div>

            {/* 드래그 정렬 그리드 */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={existingImages.map((i) => i.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {/* 기존 이미지 (드래그 가능) */}
                  {existingImages.map((image) => (
                    <SortableImage key={image.id} image={image} onRemove={handleRemoveExisting} />
                  ))}

                  {/* 새로 추가한 이미지 */}
                  {newImages.map((image) => (
                    <NewImageCard key={image.tempId} image={image} onRemove={handleRemoveNew} />
                  ))}

                  {/* 이미지 추가 버튼 */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex flex-col items-center justify-center gap-1 text-zinc-400 dark:text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
                  >
                    <span className="text-2xl leading-none">+</span>
                    <span className="text-xs">추가</span>
                  </button>
                </div>
              </SortableContext>
            </DndContext>

            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <p className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          {/* 버튼 */}
          <div className="flex gap-2 pt-2">
            <Link
              href={`/boards/${boardId}`}
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
