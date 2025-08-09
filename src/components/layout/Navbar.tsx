"use client";

import Link from "next/link";
import { useState } from "react";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "~/components/ui/button";

/**
 * Modern, responsive Navbar with sticky, blurred background and mobile menu.
 * Uses Clerk for auth controls. Matches site gradient accents and spacing.
 */
export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)]/70 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-surface-1)]/80 bg-[var(--color-surface-1)]/90">
      <nav className="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="h-16 flex items-center justify-between">
          {/* Brand */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 group"
            aria-label="Etusivu"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] shadow-sm">
              <span className="text-white font-black">R</span>
            </span>
            <span className="text-2xl-fluid font-extrabold tracking-tight text-primary group-hover:text-accent-primary transition-colors">
              Repur.fi
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/osta" className="text-secondary hover:text-primary transition-colors">Osta</Link>
            <Link href="/myy" className="text-secondary hover:text-primary transition-colors">Myy</Link>
            <Link href="/meista" className="text-secondary hover:text-primary transition-colors">Meistä</Link>

            <SignedOut>
              <Link href="/sign-in">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-neutral)] hover:bg-[var(--color-surface-3)]"
                >
                  Kirjaudu
                </Button>
              </Link>
            </SignedOut>

            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-8 h-8",
                    userButtonPopoverCard:
                      "bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-neutral)]",
                    userButtonPopoverFooter: "bg-[var(--color-surface-3)]",
                  },
                }}
                afterSignOutUrl="/"
              />
            </SignedIn>
          </div>

          {/* Mobile controls */}
          <div className="md:hidden flex items-center gap-2">
            <SignedIn>
              <UserButton
                appearance={{ elements: { userButtonAvatarBox: "w-8 h-8" } }}
                afterSignOutUrl="/"
              />
            </SignedIn>
            <Button
              variant="outline"
              size="icon"
              aria-label="Avaa valikko"
              className="border-[var(--color-border)]"
              onClick={() => setOpen((v) => !v)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
                aria-hidden
              >
                <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-surface-1)]">
          <div className="px-4 py-4 space-y-2">
            <Link href="/osta" className="block px-2 py-2 rounded-lg text-primary hover:bg-[var(--color-surface-2)]">Osta</Link>
            <Link href="/myy" className="block px-2 py-2 rounded-lg text-primary hover:bg-[var(--color-surface-2)]">Myy</Link>
            <Link href="/meista" className="block px-2 py-2 rounded-lg text-primary hover:bg-[var(--color-surface-2)]">Meistä</Link>
            <SignedOut>
              <Link href="/sign-in" className="block">
                <Button className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90">
                  Kirjaudu
                </Button>
              </Link>
            </SignedOut>
          </div>
        </div>
      )}
    </header>
  );
}
