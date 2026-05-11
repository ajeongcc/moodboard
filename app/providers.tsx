'use client'

import { ThemeProvider } from 'next-themes'

// 앱 전체에 다크모드 기능을 제공하는 컴포넌트
// layout.tsx에서 모든 페이지를 감싸고 있어
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  )
}
