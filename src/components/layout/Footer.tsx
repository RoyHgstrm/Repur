import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="py-section border-t border-[var(--color-border)] bg-[var(--color-surface-1)]">
      <div className="px-container container mx-auto">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Logo and Description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)]">
                <span className="text-lg font-bold text-white">R</span>
              </div>
              <span className="text-xl font-bold text-[var(--color-neutral)]">
                Repur.fi
              </span>
            </div>
            <p className="text-[var(--color-neutral)]/80">
              Kestävää ja luotettavaa suorituskykyä - uudelleenkäytetyt
              premium-pelikoneet.
            </p>
          </div>

          {/* Tuotteet */}
          <div>
            <h3 className="text-xl-fluid mb-4 font-semibold text-[var(--color-neutral)]">
              Tuotteet
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/osta"
                  className="text-[var(--color-neutral)]/80 hover:text-[var(--color-primary)]"
                >
                  Osta
                </Link>
              </li>
              <li>
                <Link
                  href="/myy"
                  className="text-[var(--color-neutral)]/80 hover:text-[var(--color-primary)]"
                >
                  Myy Koneesi
                </Link>
              </li>
            </ul>
          </div>

          {/* Tuki */}
          <div>
            <h3 className="text-xl-fluid mb-4 font-semibold text-[var(--color-neutral)]">
              Tuki
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/tuki"
                  className="text-[var(--color-neutral)]/80 hover:text-[var(--color-primary)]"
                >
                  Asiakastuki
                </Link>
              </li>
              <li>
                <Link
                  href="/takuu"
                  className="text-[var(--color-neutral)]/80 hover:text-[var(--color-primary)]"
                >
                  Takuu
                </Link>
              </li>
              <li>
                <Link
                  href="/yhteystiedot"
                  className="text-[var(--color-neutral)]/80 hover:text-[var(--color-primary)]"
                >
                  Yhteystiedot
                </Link>
              </li>
            </ul>
          </div>

          {/* Yritys */}
          <div>
            <h3 className="text-xl-fluid mb-4 font-semibold text-[var(--color-neutral)]">
              Yritys
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/meista"
                  className="text-[var(--color-neutral)]/80 hover:text-[var(--color-primary)]"
                >
                  Meistä
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Sosiaalinen media ja Tekijänoikeudet */}
        <div className="mt-12 flex flex-col items-center justify-between border-t border-[var(--color-border)] pt-8 md:flex-row">
          <p className="text-sm text-[var(--color-neutral)]/80">
            © {new Date().getFullYear()} Repur.fi. Kaikki oikeudet pidätetään.
          </p>
          <div className="mt-4 flex space-x-4 md:mt-0">
            <Link
              href="#"
              className="text-[var(--color-neutral)]/80 hover:text-[var(--color-primary)]"
            >
              <Facebook className="h-5 w-5" />
            </Link>
            <Link
              href="#"
              className="text-[var(--color-neutral)]/80 hover:text-[var(--color-primary)]"
            >
              <Twitter className="h-5 w-5" />
            </Link>
            <Link
              href="#"
              className="text-[var(--color-neutral)]/80 hover:text-[var(--color-primary)]"
            >
              <Instagram className="h-5 w-5" />
            </Link>
            <Link
              href="#"
              className="text-[var(--color-neutral)]/80 hover:text-[var(--color-primary)]"
            >
              <Linkedin className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
