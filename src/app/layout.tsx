import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My English App',
  description: 'Interactive subtitle player with AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-[#0f0f11] text-white">
        {children}
      </body>
    </html>
  )
}
