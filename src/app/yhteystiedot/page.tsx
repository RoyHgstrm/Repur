
// src/app/yhteystiedot/page.tsx
import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Mail, Phone, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Yhteystiedot - Repur.fi',
  description: 'Ota yhteyttä Repur.fi-tiimiin. Löydät täältä sähköpostiosoitteemme, puhelinnumeromme ja sijaintimme.',
};

export default function YhteystiedotPage() {
  return (
    <div className="container mx-auto px-container py-section">
      <header className="text-center mb-12">
        <h1 className="text-4xl-fluid font-extrabold tracking-tight text-[var(--color-neutral)]">
          Ota Yhteyttä
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg-fluid text-[var(--color-neutral)]/80">
          Onko sinulla kysyttävää tuotteistamme, tilauksestasi tai palveluistamme? Autamme mielellämme.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        <Card className="bg-[var(--color-surface-2)] border-[var(--color-border)]/50 p-8">
          <div className="flex justify-center mb-4">
            <Mail className="w-10 h-10 text-[var(--color-primary)]" />
          </div>
          <h3 className="text-xl-fluid font-bold text-[var(--color-neutral)] mb-2">Sähköposti</h3>
          <p className="text-[var(--color-neutral)]/80">Yleiset tiedustelut</p>
          <a href="mailto:asiakaspalvelu@repur.fi" className="text-[var(--color-primary)] hover:underline">
            asiakaspalvelu@repur.fi
          </a>
        </Card>

        <Card className="bg-[var(--color-surface-2)] border-[var(--color-border)]/50 p-8">
          <div className="flex justify-center mb-4">
            <Phone className="w-10 h-10 text-[var(--color-primary)]" />
          </div>
          <h3 className="text-xl-fluid font-bold text-[var(--color-neutral)] mb-2">Puhelin</h3>
          <p className="text-[var(--color-neutral)]/80">Arkisin klo 9-17</p>
          <a href="tel:+358123456789" className="text-[var(--color-primary)] hover:underline">
            +358 12 345 6789
          </a>
        </Card>

        <Card className="bg-[var(--color-surface-2)] border-[var(--color-border)]/50 p-8">
          <div className="flex justify-center mb-4">
            <MapPin className="w-10 h-10 text-[var(--color-primary)]" />
          </div>
          <h3 className="text-xl-fluid font-bold text-[var(--color-neutral)] mb-2">Sijainti</h3>
          <p className="text-[var(--color-neutral)]/80">Toimipiste (vain sopimuksen mukaan)</p>
          <p className="text-[var(--color-primary)]">Esimerkkikatu 123, 00100 Helsinki</p>
        </Card>
      </div>

      {/* Yhteydenottolomake voisi tulla tähän tulevaisuudessa */}
    </div>
  );
}
