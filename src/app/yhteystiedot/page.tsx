
// src/app/yhteystiedot/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Mail, Phone, MapPin, Clock, User, MessageSquare, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Yhteystiedot - Repur.fi',
  description: 'Ota yhteyttä Repur.fi-tiimiin. Löydät sähköpostin, puhelimen ja sijainnin sekä tukilinkit.',
};

export default function YhteystiedotPage() {
  return (
    <main className="min-h-screen bg-surface-1">
      <section className="mx-auto max-w-7xl px-container py-12">
        <header className="text-center space-y-4 mb-8">
          <h1 className="text-4xl-fluid font-extrabold text-primary">Yhteystiedot</h1>
          <p className="text-lg-fluid text-secondary max-w-2xl mx-auto">
            Kysyttävää tuotteista, tilauksesta tai takuusta? Autamme nopeasti ja ystävällisesti.
          </p>
          <div className="flex items-center justify-center gap-3">
            <a href="mailto:asiakaspalvelu@repur.fi">
              <span className="inline-flex items-center gap-2 rounded-lg px-4 py-2 bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary)]/90 transition-colors">
                <MessageSquare className="h-4 w-4" /> Lähetä sähköpostia
              </span>
            </a>
            {/* Puhelinnumero poistettu käytöstä toistaiseksi vanhentuneen tiedon välttämiseksi */}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <Card className="bg-surface-2 border-[var(--color-border-light)]">
            <CardContent className="p-6 text-center space-y-2">
              <Mail className="w-6 h-6 text-[var(--color-primary)] mx-auto" />
              <CardTitle className="text-base">Sähköposti</CardTitle>
              <p className="text-sm text-secondary">Asiakaspalvelu</p>
              <a href="mailto:asiakaspalvelu@repur.fi" className="text-sm text-[var(--color-primary)] hover:underline">asiakaspalvelu@repur.fi</a>
            </CardContent>
          </Card>

          {/* Puhelin-kortti poistettu toistaiseksi */}

          <Card className="bg-surface-2 border-[var(--color-border-light)]">
            <CardContent className="p-6 text-center space-y-2">
              <MapPin className="w-6 h-6 text-[var(--color-primary)] mx-auto" />
              <CardTitle className="text-base">Käyntiosoite</CardTitle>
              <p className="text-sm text-secondary">Teollisuuskatu 1, 00100 Helsinki</p>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Teollisuuskatu%201%2000100%20Helsinki"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[var(--color-primary)] hover:underline"
              >
                Avaa kartalla
              </a>
            </CardContent>
          </Card>
        </div>

        {/* Opening hours + support links */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-surface-2 border-[var(--color-border-light)]">
            <CardContent className="p-6 flex items-start gap-3">
              <Clock className="h-5 w-5 text-[var(--color-primary)]" />
              <div>
                <p className="text-sm font-semibold text-primary">Aukioloajat</p>
                <ul className="text-sm text-secondary space-y-1 mt-1">
                  <li>Ma–Pe: 9–17</li>
                  <li>La: 10–14 (vain nouto)</li>
                  <li>Su: Suljettu</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-surface-2 border-[var(--color-border-light)]">
            <CardContent className="p-6 flex items-start gap-3">
              <User className="h-5 w-5 text-[var(--color-primary)]" />
              <div>
                <p className="text-sm text-secondary">Tarvitsetko tukea tai takuuhuoltoa?</p>
                <div className="mt-2 flex items-center gap-3">
                  <Link href="/tuki"><Button className="h-10 px-5">Tuki</Button></Link>
                  <Link href="/takuu"><Button variant="outline" className="h-10 px-5">Takuu</Button></Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sijainti kartalla */}
        <div className="mt-6">
          <Card className="bg-surface-2 border-[var(--color-border-light)] dark:bg-surface-3 dark:border-[var(--color-border-dark)]">
            <CardHeader>
              <CardTitle className="text-base dark:text-white">Sijainti kartalla</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                <iframe
                  title="Repur.fi sijainti"
                  src="https://www.google.com/maps?q=Teollisuuskatu%201%2C%2000100%20Helsinki&output=embed"
                  className="absolute inset-0 w-full h-full border-0 dark:invert dark:brightness-90"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* UKK + Sosiaalinen media */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* FAQ Card */}
          <Card className="bg-gradient-to-br from-surface-2 to-surface-3 border-none shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-surface-1/70 px-6 py-4 border-b border-[var(--color-border-light)]">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <span className="inline-block bg-[var(--color-primary)]/10 rounded-full p-2">
                  <svg className="h-5 w-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 19v.01M12 17a5 5 0 1 0-5-5" /></svg>
                </span>
                Usein kysyttyä
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ul className="space-y-3 text-base text-secondary">
                <li>
                  <Link href="/tuki/ukk" className="group flex items-center gap-2 transition-colors hover:text-[var(--color-primary)]">
                    <span className="inline-block w-2 h-2 bg-[var(--color-primary)] rounded-full group-hover:scale-125 transition-transform" />
                    Miten takuu toimii?
                  </Link>
                </li>
                <li>
                  <Link href="/tuki/ukk" className="group flex items-center gap-2 transition-colors hover:text-[var(--color-primary)]">
                    <span className="inline-block w-2 h-2 bg-[var(--color-primary)] rounded-full group-hover:scale-125 transition-transform" />
                    Kuinka nopeasti toimitatte?
                  </Link>
                </li>
                <li>
                  <Link href="/tuki/ukk" className="group flex items-center gap-2 transition-colors hover:text-[var(--color-primary)]">
                    <span className="inline-block w-2 h-2 bg-[var(--color-primary)] rounded-full group-hover:scale-125 transition-transform" />
                    Miten palautus toimii?
                  </Link>
                </li>
              </ul>
            </CardContent>
          </Card>
          {/* Social Media Card */}
          <Card className="bg-gradient-to-br from-surface-2 to-surface-3 border-none shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-surface-1/70 px-6 py-4 border-b border-[var(--color-border-light)]">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <span className="inline-block bg-[var(--color-primary)]/10 rounded-full p-2">
                  <svg className="h-5 w-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 8a5 5 0 0 1-10 0" /><circle cx="12" cy="12" r="10" /></svg>
                </span>
                Seuraa meitä
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-5">
                <Link href="#" aria-label="Facebook" className="group transition-colors hover:text-[var(--color-primary)]">
                  <span className="inline-flex items-center justify-center rounded-full bg-surface-1/80 group-hover:bg-[var(--color-primary)]/10 p-3 transition">
                    <Facebook className="h-6 w-6" />
                  </span>
                </Link>
                <Link href="#" aria-label="Twitter" className="group transition-colors hover:text-[var(--color-primary)]">
                  <span className="inline-flex items-center justify-center rounded-full bg-surface-1/80 group-hover:bg-[var(--color-primary)]/10 p-3 transition">
                    <Twitter className="h-6 w-6" />
                  </span>
                </Link>
                <Link href="#" aria-label="Instagram" className="group transition-colors hover:text-[var(--color-primary)]">
                  <span className="inline-flex items-center justify-center rounded-full bg-surface-1/80 group-hover:bg-[var(--color-primary)]/10 p-3 transition">
                    <Instagram className="h-6 w-6" />
                  </span>
                </Link>
                <Link href="#" aria-label="LinkedIn" className="group transition-colors hover:text-[var(--color-primary)]">
                  <span className="inline-flex items-center justify-center rounded-full bg-surface-1/80 group-hover:bg-[var(--color-primary)]/10 p-3 transition">
                    <Linkedin className="h-6 w-6" />
                  </span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tietosuojahuomio */}
        <div className="mt-6">
          <p className="text-xs text-secondary text-center">
            Lähettäessäsi meille tietoja sitoudut tietojesi käsittelyyn tietosuojakäytäntömme mukaisesti. Lue lisää{' '}
            <Link href="/tietosuoja" className="text-[var(--color-primary)] hover:underline">tietosuojasta</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
