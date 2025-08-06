
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
      <header className="text-center mb-xl">
        <h1 className="text-4xl-fluid font-extrabold tracking-tight text-[var(--color-text-primary)]">
          Ota Yhteyttä
        </h1>
        <p className="mt-md max-w-2xl mx-auto text-lg-fluid text-[var(--color-text-secondary)]">
          Onko sinulla kysyttävää tuotteistamme, tilauksestasi tai palveluistamme? Autamme mielellämme.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg text-center">
        <Card className="bg-[var(--color-surface-2)] border-[var(--color-border)]/50 p-xl shadow-md hover:shadow-lg transition-shadow">
          <div className="flex justify-center mb-md">
            <Mail className="w-10 h-10 text-[var(--color-primary)]" />
          </div>
          <h3 className="text-xl-fluid font-bold text-[var(--color-text-primary)] mb-sm">Sähköposti</h3>
          <p className="text-[var(--color-text-secondary)]">Yleiset tiedustelut</p>
          <a href="mailto:asiakaspalvelu@repur.fi" className="text-[var(--color-primary)] hover:underline text-base-fluid">
            asiakaspalvelu@repur.fi
          </a>
        </Card>

        <Card className="bg-[var(--color-surface-2)] border-[var(--color-border)]/50 p-xl shadow-md hover:shadow-lg transition-shadow">
          <div className="flex justify-center mb-md">
            <Phone className="w-10 h-10 text-[var(--color-primary)]" />
          </div>
          <h3 className="text-xl-fluid font-bold text-[var(--color-text-primary)] mb-sm">Puhelin</h3>
          <p className="text-[var(--color-text-secondary)]">Arkisin klo 9-17</p>
          <a href="tel:+358123456789" className="text-[var(--color-primary)] hover:underline text-base-fluid">
            +358 12 345 6789
          </a>
        </Card>

        <Card className="bg-[var(--color-surface-2)] border-[var(--color-border)]/50 p-xl shadow-md hover:shadow-lg transition-shadow">
          <div className="flex justify-center mb-md">
            <MapPin className="w-10 h-10 text-[var(--color-primary)]" />
          </div>
          <h3 className="text-xl-fluid font-bold text-[var(--color-text-primary)] mb-sm">Sijainti</h3>
          <p className="text-[var(--color-text-secondary)]">Toimipiste (vain sopimuksen mukaan)</p>
          <p className="text-[var(--color-primary)] text-base-fluid">Esimerkkikatu 123, 00100 Helsinki</p>
        </Card>
      </div>

      {/* Yhteydenottolomake voisi tulla tähän tulevaisuudessa */}
    </div>
  );
}
