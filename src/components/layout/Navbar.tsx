"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "~/components/ui/button";
import { Logo } from "~/components/ui/Logo";

/**
 * Modern, responsive Navbar following Repur.fi design guidelines.
 * Mobile-first design with calm blue primary, fresh green success, energetic orange accents.
 */
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Track scroll for enhanced backdrop blur
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  // Keyboard navigation and focus management
  useEffect(() => {
    if (!open) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <header 
        className={`
          fixed top-0 left-0 right-0 z-50 
          transition-all duration-300 ease-out
          border-b border-[var(--color-border)]
          backdrop-blur supports-[backdrop-filter]:bg-[var(--color-surface-1)]/80 bg-[var(--color-surface-1)]/90
          ${scrolled ? 'shadow-sm' : ''}
        `}
      >
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Brand with SVG icon */}
            <Link
            href="/"
            className="inline-flex items-center gap-2 group"
            aria-label="Etusivu"
          >
              <Logo size={40} className="group-hover:shadow-lg group-hover:ring-black/20 transition-all" />
            <span className="text-4xl font-extrabold tracking-tight text-[var(--color-neutral)] group-hover:text-[var(--color-primary)] drop-shadow-sm transition-colors">
              Repur.fi
            </span>
          </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                href="/osta"
                className="px-4 py-2 text-sm font-medium text-gray-200 hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-2)]/60 rounded-lg transition-all duration-200"
              >
                Osta
              </Link>
              <Link
                href="/myy"
                className="px-4 py-2 text-sm font-medium text-gray-200 hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-2)]/60 rounded-lg transition-all duration-200"
              >
                Myy
              </Link>
              <Link
                href="/meista"
                className="px-4 py-2 text-sm font-medium text-gray-200 hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-2)]/60 rounded-lg transition-all duration-200"
              >
                Meistä
              </Link>
              <Link
                href="/yhteystiedot"
                className="px-4 py-2 text-sm font-medium text-gray-200 hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-2)]/60 rounded-lg transition-all duration-200"
              >
                Yhteystiedot
              </Link>
              <Link
                href="/tuki"
                className="px-4 py-2 text-sm font-medium text-gray-200 hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-2)]/60 rounded-lg transition-all duration-200"
              >
                Tuki
              </Link>

              <div className="ml-6 pl-6 border-l border-[var(--color-border)] flex items-center gap-3">
                <SignedOut>
                  <Link href="/sign-in">
                    <Button
                      size="sm"
                      className="bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white border-0 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      Kirjaudu
                    </Button>
                  </Link>
                </SignedOut>

                <SignedIn>
                  <UserButton
                    appearance={{
                      elements: {
                        userButtonAvatarBox: "w-8 h-8 hover:scale-105 transition-transform duration-200",
                        userButtonPopoverCard: "bg-white border-slate-200 shadow-xl",
                        userButtonPopoverFooter: "bg-slate-50",
                      },
                    }}
                    afterSignOutUrl="/"
                  />
                </SignedIn>
              </div>
            </div>

            {/* Mobile Controls */}
            <div className="md:hidden flex items-center gap-3">
              <SignedIn>
                <UserButton
                  appearance={{ 
                    elements: { 
                      userButtonAvatarBox: "w-8 h-8" 
                    } 
                  }}
                  afterSignOutUrl="/"
                />
              </SignedIn>
              
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 border-[var(--color-border)] text-[var(--color-neutral)] hover:text-[var(--color-primary-dark)] hover:bg-[var(--color-surface-2)] hover:border-[var(--color-primary)]/40"
                onClick={() => setOpen(true)}
                aria-label="Avaa valikko"
                aria-expanded={open}
              >
                <svg className="h-6 w-6 drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-md"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          
          {/* Menu Panel */}
          <div
            ref={panelRef}
            className="fixed inset-y-0 right-0 w-full max-w-sm bg-[var(--color-surface-1)] border-l border-[var(--color-border)] shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Navigointivalikko"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-3">
                  <Logo size={40} />
                <span className="text-lg font-extrabold text-[var(--color-neutral)]">Repur.fi</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={() => setOpen(false)}
                aria-label="Sulje valikko"
              >
                <svg className="h-6 w-6 text-[var(--color-neutral)] drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-6 py-6">
              <ul className="space-y-2">
                <li>
                  <Link 
                    href="/osta"
                    onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-200 hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-2)]/60 rounded-lg transition-all duration-200"
                  >
                    Osta
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/myy"
                    onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-200 hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-2)]/60 rounded-lg transition-all duration-200"
                  >
                    Myy
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/meista"
                    onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-200 hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-2)]/60 rounded-lg transition-all duration-200"
                  >
                    Meistä
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/yhteystiedot"
                    onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-200 hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-2)]/60 rounded-lg transition-all duration-200"
                  >
                    Yhteystiedot
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/tuki"
                    onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-200 hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-2)]/60 rounded-lg transition-all duration-200"
                  >
                    Tuki
                  </Link>
                </li>
              </ul>

              <SignedOut>
                <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
                  <Link href="/sign-in" onClick={() => setOpen(false)}>
                    <Button className="w-full h-10 text-sm bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200">
                      Kirjaudu
                    </Button>
                  </Link>
                </div>
              </SignedOut>
            </nav>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface-2)]/60">
              <div className="flex flex-wrap gap-4 text-sm text-gray-200">
                <Link 
                  href="/tietosuoja"
                  onClick={() => setOpen(false)}
                  className="hover:text-[var(--color-primary)] transition-colors duration-200"
                >
                  Tietosuoja
                </Link>
                <Link 
                  href="/kayttoehdot"
                  onClick={() => setOpen(false)}
                  className="hover:text-[var(--color-primary)] transition-colors duration-200"
                >
                  Käyttöehdot
                </Link>
                <Link 
                  href="/takuu"
                  onClick={() => setOpen(false)}
                  className="hover:text-[var(--color-primary)] transition-colors duration-200"
                >
                  Takuu
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}