
// src/app/yhteystiedot/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Mail, Phone, MapPin, Clock, User } from 'lucide-react';

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
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <Card className="bg-surface-2 border-[var(--color-border-light)]">
            <CardContent className="p-6 text-center space-y-2">
              <Mail className="w-6 h-6 text-[var(--color-primary)] mx-auto" />
              <CardTitle className="text-base">Sähköposti</CardTitle>
              <p className="text-sm text-secondary">Asiakaspalvelu</p>
              <a href="mailto:asiakaspalvelu@repur.fi" className="text-sm text-[var(--color-primary)] hover:underline">asiakaspalvelu@repur.fi</a>
            </CardContent>
          </Card>

          <Card className="bg-surface-2 border-[var(--color-border-light)]">
            <CardContent className="p-6 text-center space-y-2">
              <Phone className="w-6 h-6 text-[var(--color-primary)] mx-auto" />
              <CardTitle className="text-base">Puhelin</CardTitle>
              <p className="text-sm text-secondary">Arkisin klo 9–17</p>
              <a href="tel:+358403254972" className="text-sm text-[var(--color-primary)] hover:underline">+358 12 345 6789</a>
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
                <p className="text-sm text-secondary">Arkisin klo 9–17 (poikkeukset ilmoitetaan etukäteen)</p>
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
      </section>
    </main>
  );
}
