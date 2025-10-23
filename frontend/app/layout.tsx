import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Swear Jar - Social Accountability App',
  description: 'A decentralized social accountability app on Base blockchain',
  manifest: '/manifest.json',
  other: {
    'fc:miniapp': JSON.stringify({
      version: 'next',
      imageUrl: '/splash.png',
      button: {
        title: 'Open Swear Jar',
        action: {
          type: 'launch_miniapp',
          name: 'Swear Jar',
          url: '/'
        }
      }
    })
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0052FF" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
