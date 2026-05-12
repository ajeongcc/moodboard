// 유튜브/비메오 링크를 embed URL로 변환하는 함수

export type VideoPlatform = 'youtube' | 'vimeo'

export interface ParsedVideo {
  embedUrl: string
  platform: VideoPlatform
  videoId: string
}

export function parseVideoUrl(url: string): ParsedVideo | null {
  const trimmed = url.trim()

  // ── YouTube ──────────────────────────────────────────────
  // 지원 형식:
  //   https://www.youtube.com/watch?v=VIDEO_ID
  //   https://youtu.be/VIDEO_ID
  //   https://www.youtube.com/embed/VIDEO_ID
  //   https://youtube.com/shorts/VIDEO_ID
  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  if (ytMatch) {
    return {
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`,
      platform: 'youtube',
      videoId: ytMatch[1],
    }
  }

  // ── Vimeo ─────────────────────────────────────────────────
  // 지원 형식:
  //   https://vimeo.com/VIDEO_ID
  //   https://player.vimeo.com/video/VIDEO_ID
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeoMatch) {
    return {
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      platform: 'vimeo',
      videoId: vimeoMatch[1],
    }
  }

  return null
}

// YouTube 영상 썸네일 URL 반환
export function getYoutubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
}
