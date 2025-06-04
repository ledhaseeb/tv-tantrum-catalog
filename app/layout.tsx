import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TV Tantrum - Children\'s Media Discovery',
  description: 'Discover the perfect children\'s shows with detailed stimulation metrics and parent-friendly insights.',
  keywords: ['children tv shows', 'kids entertainment', 'stimulation metrics', 'parental guidance'],
  openGraph: {
    title: 'TV Tantrum - Children\'s Media Discovery',
    description: 'Discover the perfect children\'s shows with detailed stimulation metrics and parent-friendly insights.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}