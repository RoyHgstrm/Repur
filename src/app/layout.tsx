import { ClerkProvider } from '@clerk/nextjs'
import { fiFI } from '@clerk/localizations'
import { Inter } from 'next/font/google'
import Navbar from '~/components/layout/Navbar'
import Footer from '~/components/layout/Footer'
import { dark } from '@clerk/themes'
import '~/styles/globals.css'
import Providers from '~/components/layout/Providers'
import React from 'react'
import type { Metadata } from 'next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://repur.fi'),
  title: {
    default: 'Repur.fi – Kunnostetut pelikoneet',
    template: '%s | Repur.fi',
  },
  description: 'Kunnostetut, testatut pelikoneet 12 kk takuulla. Reilu hinnoittelu ja ilmainen toimitus Suomessa.',
  keywords: ['kunnostetut tietokoneet', 'pelikone', 'refurbished pc', 'gaming pc', 'Repur.fi', 'takuu', 'ilmainen toimitus', 'käytetty pelikone', 'edullinen pelikone', 'kunnostettu pc'],
  icons: {
    icon: '/icon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'fi_FI',
    url: 'https://repur.fi',
    siteName: 'Repur.fi',
    title: 'Repur.fi – Kunnostetut pelikoneet',
    description: 'Premium-tason pelikoneet kunnostettuna. 12 kk takuu ja ilmainen toimitus.',
    images: [
      {
        url: 'https://repur.fi/repur-fi-white2.png',
        width: 1200,
        height: 630,
        alt: 'Repur.fi – Kunnostetut pelikoneet',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Repur.fi – Kunnostetut pelikoneet',
    description: 'Premium-tason pelikoneet kunnostettuna. 12 kk takuu ja ilmainen toimitus.',
    images: [
      'https://repur.fi/repur-fi-white2.png',
    ],
  },
  alternates: {
    canonical: 'https://repur.fi',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover' as const,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fi" className="dark">
      <body className={`${inter.className} bg-[var(--color-surface-1)] text-[var(--color-neutral)] antialiased`}> 
        <ClerkProvider
          localization={fiFI}
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: '#2563eb',
              colorText: '#e5e7eb',
              colorBackground: '#0b1220',
              colorInputBackground: 'rgba(17, 24, 39, 0.6)',
              colorInputText: '#e5e7eb',
            },
            elements: {
              // Cards and containers
              card: 'bg-[#0e1424]/95 border border-white/10 shadow-xl rounded-xl backdrop-blur-md',
              headerTitle: 'text-[#e5e7eb] text-2xl font-bold tracking-tight',
              headerSubtitle: 'text-[#cbd5e1] text-base',

              // Fields
              formFieldLabel: 'text-[#e5e7eb] font-medium',
              formFieldInput: 'bg-[#111827]/60 border border-white/10 text-[#e5e7eb] placeholder-white/40 focus:ring-2 focus:ring-[#2563eb]/40 focus:border-[#2563eb] transition-all duration-200',
              formFieldInputIcon: 'text-white/50 focus:text-[#2563eb]',
              formFieldInputRightIcon: 'text-white/50 focus:text-[#2563eb]',

              // Buttons
              formButtonPrimary: 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white transition-colors duration-200',
              formButtonSecondary: 'bg-[#0e1424] hover:bg-[#111827] text-[#e5e7eb] border border-white/10 transition-colors duration-200',
              socialButtonsBlockButton: 'bg-[#0e1424] hover:bg-[#111827] text-[#e5e7eb] border border-white/10 transition-colors duration-200',
              socialButtonsBlockButtonText: 'text-[#e5e7eb]',

              // Footer links
              footerActionLink: 'text-[#2563eb] hover:text-[#60a5fa] transition-colors duration-200',
              footerActionText: 'text-[#cbd5e1]',

              // Misc
              logoImage: 'hidden',
            },
            layout: {
              logoPlacement: 'none',
              socialButtonsVariant: 'iconButton',
              showOptionalFields: false,
            },
          }}
        >
          <a href="#content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-[var(--color-surface-3)] focus:text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-primary)] rounded py-2">Siirry sisältöön</a>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <div className="flex-1">
              <main id="content" className="flex-1 mt-12">
                <Providers>
                  <React.Suspense fallback={<div className="text-center py-8">Ladataan...</div>}>
                    {children}
                  </React.Suspense>
                </Providers>
              </main>
            </div>
            <Footer />
          </div>
        </ClerkProvider>
      </body>
    </html>
  )
}