// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '#/context/AuthContext'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CinePlanter - Filmmakers Ecosystem',
  description: 'Discover, create, and share amazing films with the community',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {/* ✅ Universal spacing — একটু নিচে, সব page এ */}
          <div className="h-20 sm:h-24"></div>

          {children}
        </AuthProvider>
      </body>
    </html>
  )
}