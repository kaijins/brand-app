import './globals.css'
import { Metadata } from 'next'
import '../utils/devTools'  // 追加

export const metadata: Metadata = {
  title: 'Brand Analytics',
  description: 'メルカリ価格分析アプリ',
  manifest: '/manifest.json',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1
  },
  themeColor: '#1F2937',
  appleWebApp: { 
    capable: true,
    statusBarStyle: 'default',
    title: 'BrandApp'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="bg-gray-900 min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}