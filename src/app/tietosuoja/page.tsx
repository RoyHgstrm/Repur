"use client";

import Link from "next/link";
import { Card, CardContent } from "~/components/ui/card";

export default function TietosuojaPage() {
  return (
    <main className="min-h-screen bg-[var(--color-surface-1)] text-[var(--color-neutral)]">
      <section className="mx-auto max-w-4xl px-container py-section space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl-fluid sm:text-4xl-fluid font-extrabold tracking-tight">Tietosuojakäytäntö</h1>
          <p className="text-sm text-[var(--color-neutral)]/70">Viimeksi päivitetty: {new Date().toLocaleDateString("fi-FI")}</p>
        </header>

        <Card className="bg-[var(--color-surface-2)] border-[var(--color-border)]">
          <CardContent className="prose prose-invert max-w-none p-6">
            <h2>1. Rekisterinpitäjä</h2>
            <p>Repur.fi (&quot;me&quot;) toimii henkilötietojen rekisterinpitäjänä.</p>

            <h2>2. Kerättävät tiedot</h2>
            <p>
              Käsittelemme palvelun tarjoamiseen tarvittavia tietoja, kuten nimi, sähköposti, yhteystiedot, tilaus- ja huoltotiedot sekä tunnistautumistiedot (Clerk).
            </p>

            <h2>3. Tietojen käyttötarkoitus</h2>
            <ul>
              <li>Palvelun toimittaminen ja asiakassuhteen hoito</li>
              <li>Tilausten käsittely ja takuuasiat</li>
              <li>Palvelun kehittäminen ja tietoturva</li>
            </ul>

            <h2>4. Säilytysaika</h2>
            <p>
              Säilytämme tietoja vain niin kauan kuin se on tarpeen käyttötarkoitusten täyttämiseksi ja lainsäädännön edellyttämänä.
            </p>

            <h2>5. Tietojen luovutus ja siirto</h2>
            <p>
              Tietoja voidaan luovuttaa luotetuille palveluntarjoajille (esim. maksupalvelu, logistiikka) sopimuksen toteuttamiseksi. Emme myy henkilötietoja kolmansille osapuolille.
            </p>

            <h2>6. Oikeutesi</h2>
            <ul>
              <li>Tarkastaa omat tietosi</li>
              <li>Pyytää oikaisua tai poistamista</li>
              <li>Vastustaa käsittelyä tai rajoittaa sitä soveltuvin osin</li>
            </ul>

            <h2>7. Evästeet</h2>
            <p>
              Käytämme välttämättömiä evästeitä palvelun toiminnan varmistamiseksi sekä analytiikkaa palvelun kehittämiseksi. Voit säätää selaimesi evästeasetuksia.
            </p>

            <h2>8. Yhteydenotto</h2>
            <p>
              Tietosuoja-asioissa olethan yhteydessä: <Link href="/yhteystiedot" className="text-[var(--color-primary)] hover:underline">/yhteystiedot</Link>.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}


