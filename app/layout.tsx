import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="bg-gray-900 min-h-screen">
        <div className="contents">
          {children}
        </div>
      </body>
    </html>
  )
}