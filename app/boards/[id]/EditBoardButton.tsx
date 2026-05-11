import Link from 'next/link'

export default function EditBoardButton({ boardId }: { boardId: string }) {
  return (
    <Link
      href={`/boards/${boardId}/edit`}
      className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 transition"
    >
      편집
    </Link>
  )
}
