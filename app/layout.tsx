import './globals.css'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Brand Analytics',
  description: 'メルカリ価格分析アプリ',
  manifest: '/manifest.json',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1
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