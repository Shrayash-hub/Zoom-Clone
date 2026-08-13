import type { Metadata } from 'next'
import type React from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'Zoom Workplace',
  description: 'Zoom Workplace — video meetings, webinars, and collaboration',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
