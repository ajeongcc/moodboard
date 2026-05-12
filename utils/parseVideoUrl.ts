// YouTube / Vimeo / SoundCloud 링크를 embed URL로 변환하는 함수

export type MediaPlatform = 'youtube' | 'vimeo' | 'soundcloud' | 'spotify' | 'applemusic'

export interface ParsedMedia {
  embedUrl: string
  platform: MediaPlatform
  videoId: string  // SoundCloud는 원본 URL을 그대로 사용
}

export function parseVideoUrl(url: string): ParsedMedia | null {
  const trimmed = url.trim()

  // ── YouTube ──────────────────────────────────────────────
  // 지원 형식:
  //   https://www.youtube.com/watch?v=VIDEO_ID
  //   https://youtu.be/VIDEO_ID
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

  // ── Spotify ───────────────────────────────────────────────
  // 지원 형식:
  //   https://open.spotify.com/track/ID
  //   https://open.spotify.com/album/ID
  //   https://open.spotify.com/playlist/ID
  //   https://open.spotify.com/episode/ID
  const spotifyMatch = trimmed.match(
    /open\.spotify\.com\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/
  )
  if (spotifyMatch) {
    return {
      embedUrl: `https://open.spotify.com/embed/${spotifyMatch[1]}/${spotifyMatch[2]}`,
      platform: 'spotify',
      videoId: spotifyMatch[2],
    }
  }

  // ── Apple Music ──────────────────────────────────────────
  // 지원 형식:
  //   https://music.apple.com/kr/album/title/123456789
  //   https://music.apple.com/kr/album/title/123456789?i=987654321  (트랙)
  //   https://music.apple.com/kr/playlist/title/pl.abc123
  // embed: music.apple.com → embed.music.apple.com
  if (trimmed.match(/music\.apple\.com\/.+\/(album|playlist|song)/)) {
    return {
      embedUrl: trimmed.replace('music.apple.com', 'embed.music.apple.com'),
      platform: 'applemusic',
      videoId: trimmed,
    }
  }

  // ── SoundCloud ────────────────────────────────────────────
  // 지원 형식:
  //   https://soundcloud.com/artist/track
  //   https://soundcloud.com/artist/sets/playlist
  if (trimmed.match(/soundcloud\.com\/[\w-]+\/[\w-]+/)) {
    return {
      embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(trimmed)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=false&show_user=true&show_reposts=false`,
      platform: 'soundcloud',
      videoId: trimmed, // SoundCloud는 URL 자체를 ID로 사용
    }
  }

  return null
}

// YouTube 영상 썸네일 URL 반환
export function getYoutubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
}
