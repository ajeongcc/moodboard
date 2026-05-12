'use client'

interface Props {
  embedUrl: string
  platform: 'youtube' | 'vimeo' | 'soundcloud'
}

// 보드 뷰에서 영상/음악을 보여주는 플레이어 컴포넌트
export default function VideoEmbed({ embedUrl, platform }: Props) {
  // SoundCloud는 가로 바 형태의 플레이어 (고정 높이)
  if (platform === 'soundcloud') {
    return (
      <div className="break-inside-avoid mb-3 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        <iframe
          src={embedUrl}
          width="100%"
          height="166"
          scrolling="no"
          allow="autoplay"
          title="SoundCloud 음악"
          className="block"
        />
      </div>
    )
  }

  // YouTube / Vimeo — 16:9 비율 플레이어
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
