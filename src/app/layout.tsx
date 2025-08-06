import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from 'next/font/google'
import Navbar from '~/components/layout/Navbar'
import Footer from '~/components/layout/Footer'
import { dark } from '@clerk/themes'
import '~/styles/globals.css'
import Providers from '~/components/layout/Providers'
import React from 'react'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Repur.fi - Kunnostetut Pelikoneet',
  description: 'Kunnostetut ja luotettavat pelikoneet edulliseen hintaan',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: 'oklch(var(--color-primary))', // Repur brand blue
          colorBackground: 'oklch(var(--color-surface-1))', // Dark background
          colorText: 'oklch(var(--color-neutral))',
          colorInputBackground: 'oklch(var(--color-surface-2))',
          colorInputText: 'oklch(var(--color-neutral))',
        },
        elements: {
          card: 'bg-[var(--color-surface-secondary)] border-[var(--color-border)] shadow-xl rounded-xl',
          formButtonPrimary: 'bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white transition-colors duration-200',
          formButtonSecondary: 'bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-neutral)] transition-colors duration-200',
          socialButtonsBlockButton: 'bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-neutral)] transition-colors duration-200',
          socialButtonsBlockButtonText: 'text-[var(--color-neutral)]',
          formFieldLabel: 'text-[var(--color-neutral)] font-medium',
          formFieldInput: 'bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-neutral)] focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)] transition-all duration-200',
          footerActionLink: 'text-[var(--color-primary)] hover:text-[var(--color-primary)]/80 transition-colors duration-200',
          footerActionText: 'text-[var(--color-neutral)]',
          
          // Remove Clerk branding and improve typography
          logoImage: 'hidden', // Hide logo
          headerTitle: 'text-[var(--color-neutral)] text-2xl font-bold tracking-tight',
          headerSubtitle: 'text-[var(--color-neutral)] text-base',
          
          // Icons and interactive elements
          formFieldInputIcon: 'text-[var(--color-neutral)]/50 focus:text-[var(--color-primary)]',
          formFieldInputRightIcon: 'text-[var(--color-neutral)]/50 focus:text-[var(--color-primary)]',
        },
        layout: {
          logoPlacement: 'none', // Remove logo placement
          socialButtonsVariant: 'iconButton', // Compact social buttons
          showOptionalFields: false, // Minimize optional fields
        },
      }}
    >
      <html lang="fi" className="dark">
        <body className={`${inter.className} bg-[var(--color-surface-1)] text-[var(--color-neutral)] antialiased`}>
          <div className=" min-h-screen">
            <Navbar />
            <main>
              <Providers>
                <React.Suspense fallback={<div className="text-center py-8">Ladataan...</div>}>
                  {children}
                </React.Suspense>
              </Providers>
            </main>
            <Footer />
          </div>
        </body>
      </html>
    </ClerkProvider>
  )
}