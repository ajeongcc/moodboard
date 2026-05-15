import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// 이메일 인증 링크 클릭 시 이 라우트에서 세션을 교환하고 앱으로 이동
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/explore'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // 실패 시 로그인 페이지로
  return NextResponse.redirect(`${origin}/login`)
}
