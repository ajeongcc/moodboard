'use client'

interface Props {
  embedUrl: string
  platform: 'youtube' | 'vimeo'
}

// 보드 뷰에서 영상을 보여주는 플레이어 컴포넌트
export default function VideoEmbed({ embedUrl, platform }: Props) {
  return (
    <div className="break-inside-avoid mb-3 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800">
      <div className="relative w-full aspect-video">
        <iframe
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          title={platform === 'youtube' ? 'YouTube 영상' : 'Vimeo 영상'}
        />
      </div>
    </div>
  )
}
