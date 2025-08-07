
// src/app/takuu/page.tsx
import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { CheckCircle2, Shield, Wrench } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Takuu - Repur.fi',
  description: 'Tutustu Repur.fi:n kattavaan 12 kuukauden takuuseen. Tarjoamme luotettavaa tukea ja turvaa kunnostetuille tietokoneillemme.',
};

const warrantyFeatures = [
  {
    icon: <Shield className="w-8 h-8 text-[var(--color-primary)]" />,
    title: '12 Kuukauden Kattava Takuu',
    description: 'Jokainen myymämme tietokone sisältää 12 kuukauden takuun, joka kattaa laitteistoviat ja toimintahäiriöt. Pelaa huoletta, me pidämme huolen lopusta.',
  },
  {
    icon: <Wrench className="w-8 h-8 text-[var(--color-primary)]" />,
    title: 'Ammattitaitoinen Huolto',
    description: 'Jos kohtaat ongelmia, asiantunteva tiimimme diagnosoi ja korjaa vian nopeasti. Käytämme vain laadukkaita varaosia varmistaaksemme koneesi pitkäikäisyyden.',
  },
  {
    icon: <CheckCircle2 className="w-8 h-8 text-[var(--color-primary)]" />,
    title: 'Laadunvarmistus',
    description: 'Kaikki tietokoneemme läpikäyvät tiukan testaus- ja kunnostusprosessin ennen myyntiä. Takaamme, että saat laadukkaan ja luotettavan tuotteen.',
  },
];

export default function TakuuPage() {
  return (
    <div className="container mx-auto px-container py-section">
      <header className="text-center mb-xl">
        <h1 className="text-4xl-fluid font-extrabold tracking-tight text-[var(--color-text-primary)]">
          Repur.fi Takuu
        </h1>
        <p className="mt-md max-w-3xl mx-auto text-lg-fluid text-[var(--color-text-secondary)]">
          Seisomme tuotteidemme takana. Tarjoamme selkeän ja reilun takuun, jotta voit keskittyä olennaiseen: pelaamiseen.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-2xl">
        {warrantyFeatures.map((feature, index) => (
          <Card key={index} className="bg-[var(--color-surface-2)] border-[var(--color-border)]/50 p-lg text-center shadow-md hover:shadow-lg transition-shadow">
            <div className="flex justify-center mb-md">{feature.icon}</div>
            <h3 className="text-xl-fluid font-bold text-[var(--color-text-primary)] mb-sm">{feature.title}</h3>
            <p className="text-[var(--color-text-secondary)] text-base-fluid">{feature.description}</p>
          </Card>
        ))}
      </div>

      <Card className="bg-[var(--color-surface-2)] border-[var(--color-border)]/50 p-xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl-fluid font-bold text-[var(--color-text-primary)]">Takuuehdot lyhyesti</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-md text-[var(--color-text-secondary)] list-disc list-inside">
            <li>Takuu on voimassa 12 kuukautta ostopäivästä.</li>
            <li>Takuu kattaa kaikki laitteistoviat, jotka eivät ole käyttäjän itse aiheuttamia.</li>
            <li>Ohjelmistovirheet, haittaohjelmat tai virukset eivät kuulu takuun piiriin.</li>
            <li>Takuu ei kata fyysisiä vaurioita, nesteen aiheuttamia vikoja tai virheellisestä käytöstä johtuvia ongelmia.</li>
            <li>Takuukorjaukset suoritetaan meidän toimestamme. Laitteen omatoiminen avaaminen tai korjaaminen voi mitätöidä takuun.</li>
            <li>Säilytä ostokuitti, se toimii takuutodistuksena.</li>
          </ul>
          <p className="mt-lg text-[var(--color-text-secondary)]">
            Jos sinulla on kysyttävää takuusta tai haluat tehdä takuuvaatimuksen, ole hyvä ja <a href="/yhteystiedot" className="text-[var(--color-primary)] hover:underline">ota meihin yhteyttä</a>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
