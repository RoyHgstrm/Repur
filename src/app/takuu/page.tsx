// src/app/takuu/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { CheckCircle2, Shield, Wrench, Truck, Info, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Takuu - Repur.fi',
  description: 'Repur.fi – 12 kuukauden takuu kunnostetuille pelikoneille. Lue mitä takuu kattaa ja miten teet takuupyynnön.',
};

export default function TakuuPage() {
  const highlights = [
    { Icon: Shield, title: '12 kuukauden takuu', desc: 'Kaikille koneille. Takuu alkaa ostopäivästä.' },
    { Icon: Wrench, title: 'Ammattitaitoinen huolto', desc: 'Diagnoosi ja korjaus laadukkailla varaosilla.' },
    { Icon: CheckCircle2, title: 'Testattu laatu', desc: 'Jokainen kone kuormitustestataan ennen myyntiä.' },
    { Icon: Truck, title: 'Nopea käsittely', desc: 'Takuuhuollot käsitellään viipymättä.' },
  ];

  return (
    <main className="min-h-screen bg-surface-1">
      <section className="mx-auto max-w-7xl px-container py-12">
        <header className="text-center space-y-4 mb-8">
          <h1 className="text-4xl-fluid font-extrabold text-primary">Takuu</h1>
          <p className="text-lg-fluid text-secondary max-w-3xl mx-auto">
            Seisomme tuotteidemme takana. Tarjoamme selkeän ja reilun takuun, jotta voit keskittyä pelaamiseen.
          </p>
        </header>

        {/* Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {highlights.map(({ Icon, title, desc }) => (
            <Card key={title} className="bg-surface-2 border-[var(--color-border-light)]">
              <CardContent className="p-5 flex items-start gap-3">
                <Icon className="h-5 w-5 text-[var(--color-primary)]" />
                <div>
                  <p className="text-sm font-semibold text-primary">{title}</p>
                  <p className="text-sm text-secondary">{desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Coverage */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-surface-2 border-[var(--color-border-light)]">
            <CardHeader>
              <CardTitle className="text-xl-fluid">Mitä takuu kattaa</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ul className="text-sm text-secondary space-y-2 list-disc list-inside">
                <li>Laitteistoviat normaalissa käytössä (CPU, GPU, RAM, emolevy, SSD/HDD, virtalähde)</li>
                <li>Vastaanottovaiheessa havaitsemattomat valmistus- ja komponenttivirheet</li>
                <li>Korjaus Repur.fi:n huollossa – käytämme laadukkaita varaosia</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="bg-surface-2 border-[var(--color-border-light)]">
            <CardHeader>
              <CardTitle className="text-xl-fluid">Mitä takuu ei kata</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ul className="text-sm text-secondary space-y-2 list-disc list-inside">
                <li>Käyttö- ja ohjelmistovirheet, haittaohjelmat tai käyttöjärjestelmän rikkoutuminen</li>
                <li>Fyysiset vauriot, nestevahingot tai väärästä käytöstä aiheutuneet viat</li>
                <li>Omatoimiset korjaukset tai muutokset, jotka rikkovat takuusinetit</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* How to claim */}
        <Card className="bg-surface-2 border-[var(--color-border-light)] mb-8">
          <CardHeader>
            <CardTitle className="text-xl-fluid">Näin teet takuupyynnön</CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: '1. Varmista tiedot', desc: 'Etsi tilausnumero ja kuvaile vika lyhyesti.' },
              { title: '2. Ota yhteyttä', desc: <>Täytä <Link href="/tuki" className="text-[var(--color-primary)] hover:underline">tukipyyntö</Link> tai ota yhteyttä <Link href="/yhteystiedot" className="text-[var(--color-primary)] hover:underline">yhteystiedoista</Link>.</> },
              { title: '3. Toimitus huoltoon', desc: 'Saat ohjeet laitteen pakkaamiseen ja toimitukseen.' },
              { title: '4. Korjaus ja palautus', desc: 'Korjaamme ja testaamme – palautamme koneen viipymättä.' },
            ].map(({ title, desc }) => (
              <div key={title} className="space-y-1">
                <p className="text-sm font-semibold text-primary">{title}</p>
                <p className="text-sm text-secondary">{desc}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Additional notes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-surface-2 border-[var(--color-border-light)]">
            <CardContent className="p-6 flex items-start gap-3">
              <Clock className="h-5 w-5 text-[var(--color-primary)]" />
              <p className="text-sm text-secondary">
                Käsittelemme takuupyynnöt mahdollisimman nopeasti. Arvioitu käsittelyaika ilmoitetaan tapauskohtaisesti
                vian laadusta riippuen.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-surface-2 border-[var(--color-border-light)]">
            <CardContent className="p-6 flex items-start gap-3">
              <Info className="h-5 w-5 text-[var(--color-primary)]" />
              <p className="text-sm text-secondary">
                Takuu ei rajoita kuluttajansuojalain mukaisia oikeuksiasi. Säilytä ostokuitti – se toimii takuutodistuksena.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/tuki"><Button className="h-11 px-6">Tee tukipyyntö</Button></Link>
          <Link href="/yhteystiedot"><Button variant="outline" className="h-11 px-6">Yhteystiedot</Button></Link>
        </div>
      </section>
    </main>
  );
}
