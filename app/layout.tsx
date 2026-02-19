import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
// Analytics removed for local development
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ToastProvider, ToastContainer } from "@/components/toast"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "OneselfAI - AI Interview Preparation Platform",
  description: "Master your interviews with AI-powered preparation, real-time feedback, and emotion analysis",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <ToastProvider>
            {children}
            <ToastContainer />
          </ToastProvider>
        </ThemeProvider>

      </body>
    </html>
  )
}
