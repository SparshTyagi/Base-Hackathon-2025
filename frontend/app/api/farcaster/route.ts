import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    accountAssociation: {
      header: "X-Farcaster-Account-Association",
      payload: "eyJ1aWQiOiIxMjM0NTY3ODkwIiwidGltZXN0YW1wIjoiMTcwMDAwMDAwMCIsIm5ldHdvcmsiOiJiYXNlIn0=",
      signature: "0x1234567890abcdef"
    },
    frame: {
      version: 'next',
      name: 'Swear Jar - Social Accountability',
      iconUrl: '/icon-192.png',
      homeUrl: '/',
      splashImageUrl: '/splash.png',
      splashBackgroundColor: '#ffffff',
      primaryCategory: 'social',
      tags: ['base', 'piggybank', 'miniapp', 'social', 'accountability']
    }
  })
}
