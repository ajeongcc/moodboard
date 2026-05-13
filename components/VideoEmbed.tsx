'use client'

interface Props {
  embedUrl: string
  platform: 'youtube' | 'vimeo' | 'soundcloud' | 'spotify' | 'applemusic'
}

// 보드 뷰에서 영상/음악을 보여주는 플레이어 컴포넌트
export default function VideoEmbed({ embedUrl, platform }: Props) {
  // Spotify — 트랙은 80px, 앨범/플레이리스트는 더 크게
  if (platform === 'spotify') {
    const isCompact = embedUrl.includes('/track/') || embedUrl.includes('/episode/')
    return (
      <div className="break-inside-avoid mb-[30px] rounded-[1.8px] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        <iframe
          src={`${embedUrl}?utm_source=generator`}
          width="100%"
          height={isCompact ? '80' : '380'}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          title="Spotify 음악"
          className="block"
        />
      </div>
    )
  }

  // Apple Music — 트랙은 152px, 앨범/플레이리스트는 400px
  // iframe 자체 높이보다 컨테이너를 작게 설정해 아래쪽 흰 공백을 잘라냄
  if (platform === 'applemusic') {
    const isTrack = embedUrl.includes('?i=') || embedUrl.includes('/song/')
    const containerHeight = isTrack ? 158 : 400
    const iframeHeight = isTrack ? 175 : 450
    return (
      <div
        className="break-inside-avoid mb-[30px] rounded-[1.8px] overflow-hidden bg-zinc-100 dark:bg-zinc-800"
        style={{ height: `${containerHeight}px` }}
      >
        <iframe
          src={embedUrl}
          width="100%"
          height={iframeHeight}
          allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
          sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
          title="Apple Music"
          className="block"
        />
      </div>
    )
  }

  // SoundCloud는 가로 바 형태의 플레이어 (고정 높이)
  if (platform === 'soundcloud') {
    return (
      <div className="break-inside-avoid mb-[30px] rounded-[1.8px] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
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
    <div className="break-inside-avoid mb-[30px] rounded-[1.8px] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
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
