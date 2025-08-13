"use client";

import Link from "next/link";
import { Card, CardContent } from "~/components/ui/card";

export default function KayttoehdotPage() {
  return (
    <main className="min-h-screen bg-[var(--color-surface-1)] text-[var(--color-neutral)]">
      <section className="mx-auto max-w-4xl px-container py-section space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl-fluid sm:text-4xl-fluid font-extrabold tracking-tight">Käyttöehdot</h1>
          <p className="text-sm text-[var(--color-neutral)]/70">Viimeksi päivitetty: {new Date().toLocaleDateString("fi-FI")}</p>
        </header>

        <Card className="bg-[var(--color-surface-2)] border-[var(--color-border)]">
          <CardContent className="prose prose-invert max-w-none p-6">
            <h2>1. Palvelun tarjoaja</h2>
            <p>
              Repur.fi kunnostaa ja myy käytettyjä tietokoneita Suomessa. Näitä käyttöehtoja sovelletaan verkkosivuston ja palveluiden käyttöön.
            </p>

            <h2>2. Sivuston käyttö</h2>
            <p>
              Sitoudut käyttämään sivustoa lain ja hyvien tapojen mukaisesti. Et saa häiritä palvelun toimintaa tai yrittää päästä luvattomasti palvelinympäristöihin.
            </p>

            <h2>3. Tuotteet ja hinnat</h2>
            <p>
              Tuotekuvaukset ja hinnat esitetään mahdollisimman tarkasti. Pidätämme oikeuden korjata virheet ja päivittää tietoja ilman erillistä ilmoitusta.
            </p>

            <h2>4. Toimitus ja takuu</h2>
            <p>
              Toimitus tapahtuu Tuotteet-sivuilla kuvatuilla tavoilla. Kaikilla koneilla on 12 kuukauden takuu. Katso tarkemmat ehdot: <Link href="/takuu" className="text-[var(--color-primary)] hover:underline">Takuu- ja palautusehdot</Link>.
            </p>

            <h2>5. Palautukset</h2>
            <p>
              Palautukset käsitellään kuluttajalainsäädännön ja takuuehtojen mukaisesti. Olethan yhteydessä meihin ennen palautusta: <Link href="/yhteystiedot" className="text-[var(--color-primary)] hover:underline">/yhteystiedot</Link>.
            </p>

            <h2>6. Vastuunrajoitus</h2>
            <p>
              Emme vastaa välillisistä vahingoista tai kolmansien osapuolten palveluista. Palvelu tarjotaan &quot;sellaisena kuin se on&quot; ilman erillisiä takuita.
            </p>

            <h2>7. Muutokset ehtoihin</h2>
            <p>
              Voimme päivittää käyttöehtoja. Merkittävistä muutoksista tiedotetaan sivustolla. Jatkamalla palvelun käyttöä hyväksyt muutokset.
            </p>

            <h2>8. Yhteystiedot</h2>
            <p>
              Kysymykset ja palautteet: <Link href="/yhteystiedot" className="text-[var(--color-primary)] hover:underline">/yhteystiedot</Link>.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}


