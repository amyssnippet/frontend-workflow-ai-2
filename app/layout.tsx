"use client"

import React from "react"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import AppLayout from "@/components/layout/AppLayout"
import { Analytics } from "@vercel/analytics/next"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-tr from-indigo-700 via-purple-700 to-pink-700 relative transition-colors">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AppLayout>
            {children}
          </AppLayout>
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
