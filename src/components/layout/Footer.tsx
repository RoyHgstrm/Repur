import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

/**
 * Modern Footer with newsletter, social links and consistent spacing.
 * Follows the site's gradient accents and typography.
 */
export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface-1)]">
      <div className="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-section">


        {/* Columns */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Logo and Description */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)]">
                <span className="text-sm font-black text-white">R</span>
              </div>
              <span className="text-xl font-bold text-primary">Repur.fi</span>
            </div>
            <p className="text-secondary">
              Kestävää ja luotettavaa suorituskykyä – uudelleenkäytetyt premium-pelikoneet.
            </p>
          </div>

          {/* Tuotteet */}
          <div>
            <h3 className="text-xl-fluid mb-4 font-semibold text-primary">Tuotteet</h3>
            <ul className="space-y-2">
              <li><Link href="/osta" className="text-secondary hover:text-primary">Osta</Link></li>
              <li><Link href="/myy" className="text-secondary hover:text-primary">Myy Koneesi</Link></li>
            </ul>
          </div>

          {/* Tuki */}
          <div>
            <h3 className="text-xl-fluid mb-4 font-semibold text-primary">Tuki</h3>
            <ul className="space-y-2">
              <li><Link href="/tuki" className="text-secondary hover:text-primary">Asiakastuki</Link></li>
              <li><Link href="/takuu" className="text-secondary hover:text-primary">Takuu</Link></li>
              <li><Link href="/yhteystiedot" className="text-secondary hover:text-primary">Yhteystiedot</Link></li>
            </ul>
          </div>

          {/* Yritys */}
          <div>
            <h3 className="text-xl-fluid mb-4 font-semibold text-primary">Yritys</h3>
            <ul className="space-y-2">
              <li><Link href="/meista" className="text-secondary hover:text-primary">Meistä</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between border-t border-[var(--color-border)] pt-8 md:flex-row">
          <p className="text-sm text-secondary">© {new Date().getFullYear()} Repur.fi. Kaikki oikeudet pidätetään.</p>
          <div className="mt-4 flex gap-4 md:mt-0">
            <Link href="#" className="text-tertiary hover:text-primary" aria-label="Facebook"><Facebook className="h-5 w-5" /></Link>
            <Link href="#" className="text-tertiary hover:text-primary" aria-label="Twitter"><Twitter className="h-5 w-5" /></Link>
            <Link href="#" className="text-tertiary hover:text-primary" aria-label="Instagram"><Instagram className="h-5 w-5" /></Link>
            <Link href="#" className="text-tertiary hover:text-primary" aria-label="LinkedIn"><Linkedin className="h-5 w-5" /></Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
