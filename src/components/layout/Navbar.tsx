"use client";

import Link from "next/link";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "~/components/ui/button";

export default function Navbar() {
  return (
    <nav className="border-b border-[var(--color-border)] bg-[var(--color-surface-1)] py-4 shadow-sm">
      <div className="px-container container mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="text-2xl-fluid inline-flex items-center font-extrabold transition-colors hover:text-[var(--color-accent)]"
        >
          <span className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent italic">
            Repur
          </span>
          <span className="text-white text-lg">.fi</span>
        </Link>

        <div className="group flex items-center space-x-4">
          <Link
            href="/osta"
            className="text-[var(--color-neutral)]/80 transition-all duration-200 ease-out hover:scale-105 hover:text-[var(--color-primary)]"
          >
            Osta
          </Link>
          <Link
            href="/myy"
            className="text-[var(--color-neutral)]/80 transition-all duration-200 ease-out hover:scale-105 hover:text-[var(--color-primary)]"
          >
            Myy
          </Link>
          <Link
            href="/meista"
            className="text-[var(--color-neutral)]/80 transition-all duration-200 ease-out hover:scale-105 hover:text-[var(--color-primary)]"
          >
            Meistä
          </Link>

          <SignedOut>
            <SignInButton mode="modal">
              <Button
                variant="outline"
                size="sm"
                className="border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-neutral)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-[var(--color-surface-3)] hover:shadow-md focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95"
              >
                Kirjaudu
              </Button>
            </SignInButton>
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
      </div>
    </nav>
  );
}
