'use client'

import Link from 'next/link'
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { Button } from '~/components/ui/button'

export default function Navbar() {
  return (
    <nav className="bg-secondary dark:bg-gray-900 py-4 border-b border-gray-800">
      <div className="container mx-auto flex justify-between items-center px-4">
        <Link href="/" className="text-2xl font-bold text-foreground dark:text-white">
          Repur.fi
        </Link>
        
        <div className="flex items-center space-x-4">
          <Link href="/osta" className="text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white transition-colors">
            Osta
          </Link>
          <Link href="/myy" className="text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white transition-colors">
            Myy
          </Link>
          <Link href="/meista" className="text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white transition-colors">Meistä</Link>


          
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="outline" size="sm" className="dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700">
                Kirjaudu
              </Button>
            </SignInButton>
          </SignedOut>
          
          <SignedIn>
            <UserButton 
              appearance={{
                elements: {
                  userButtonAvatarBox: 'w-8 h-8',
                  userButtonPopoverCard: 'bg-secondary dark:bg-gray-900 border-border dark:border-gray-800 text-foreground dark:text-white',
                  userButtonPopoverFooter: 'bg-muted dark:bg-gray-800'
                }
              }}
              afterSignOutUrl="/"
            />
          </SignedIn>
        </div>
      </div>
    </nav>
  )
}