import type { ReactNode } from 'react'

export const metadata = {
  title: 'React Native AI Server',
  description: 'Next.js backend proxy for React Native AI'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
