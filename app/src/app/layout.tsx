import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: "HAIR'ITAGE — Carte Fidélité",
  description: 'Votre carte de fidélité digitale Hair\'itage',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-[#0F0F0D] text-[#F0EBE0]">
        {children}
      </body>
    </html>
  )
}
