import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import '../globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import AppLayout from '@/components/layout/AppLayout'

export const metadata: Metadata = {
  title: 'FlowAI - Intelligent Flowchart Creator',
  description: 'Create beautiful flowcharts with AI-powered assistance',
  generator: 'FlowAI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <><AppLayout>
      {children}
    </AppLayout>
      <Toaster />
      <Analytics />
    </>
  )
}
