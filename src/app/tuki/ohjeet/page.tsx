"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import { Package, ShieldCheck, Truck, Wrench, FileText, Search } from "lucide-react";
import type { ReactNode } from "react";

type Guide = {
  id: string;
  title: string;
  icon: ReactNode;
  items: { label: string; description: string }[];
};

export default function OhjeetPage() {
  const [query, setQuery] = useState("");

  const guides: Guide[] = useMemo(
    () => [
      {
        id: "tilaus-toimitus",
        title: "Tilaus ja toimitus",
        icon: <Truck className="h-5 w-5 text-[var(--color-primary)]" />,
        items: [
          { label: "Tilauksen tekeminen", description: "Valitse tuote sivulta /osta ja lisää ostoskoriin. Vahvista tilaus kassalla." },
          { label: "Toimitus", description: "Toimitus on ilmainen Suomessa. Lähetämme tilauksen viimeistään seuraavana arkipäivänä." },
          { label: "Seuranta", description: "Saat sähköpostitse seurantakoodin, kun paketti on matkalla." },
        ],
      },
      {
        id: "takuu-palautus",
        title: "Takuu ja palautus",
        icon: <ShieldCheck className="h-5 w-5 text-[var(--color-success)]" />,
        items: [
          { label: "Takuu", description: "Kaikilla tuotteilla on 12 kuukauden takuu. Katso ehdot sivulta /takuu." },
          { label: "Palautus", description: "14 päivän palautusoikeus. Tuotteen tulee olla alkuperäisessä kunnossa ja pakkauksessa." },
          { label: "Takuupyyntö", description: "Ota yhteyttä sivun /yhteystiedot kautta – ohjaamme vianmäärityksessä ja palautuksessa." },
        ],
      },
      {
        id: "kayttoonotto",
        title: "Käyttöönotto",
        icon: <Package className="h-5 w-5 text-[var(--color-accent)]" />,
        items: [
          { label: "Pakkaus", description: "Tarkista, että kaikki kaapelit ja osat ovat mukana. Kirjaa mahdolliset puutteet heti ylös." },
          { label: "Ensikäynnistys", description: "Kytke virtajohto, näyttö ja oheislaitteet. Käynnistä PC ja seuraa Windowsin ohjeita." },
          { label: "Päivitykset", description: "Asenna Windows-päivitykset ja näytönohjaimen ajurit (NVIDIA/AMD)." },
        ],
      },
      {
        id: "vianetsinta",
        title: "Vianetsintä",
        icon: <Wrench className="h-5 w-5 text-[var(--color-warning)]" />,
        items: [
          { label: "Ei kuvaa näytölle", description: "Tarkista näyttökaapeli (HDMI/DP) ja että johto on kiinni näytönohjaimessa, ei emolevyssä." },
          { label: "Käynnistysongelma", description: "Irrota virta 10 sekunniksi ja kokeile uudelleen. Jos ongelma jatkuu, ota yhteyttä tukeen." },
          { label: "Korkea lämpötila", description: "Varmista hyvä ilmanvaihto, poista esteet ilmanotoista ja päivitä ajurit." },
        ],
      },
    ],
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return guides;
    return guides
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (it) => it.label.toLowerCase().includes(q) || it.description.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [guides, query]);

  return (
    <main className="min-h-screen bg-[var(--color-surface-1)] text-[var(--color-text-primary)]">
      <section className="mx-auto max-w-7xl px-container py-section">
        <header className="text-center space-y-4 mb-8">
          <h1 className="text-4xl-fluid font-extrabold">Ohjeet</h1>
          <p className="text-lg-fluid text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            Selkeät ohjeet tilaukseen, toimitukseen, takuuseen ja käyttöönottoon.
          </p>
        </header>

        <div className="mx-auto max-w-3xl mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Hae ohjeista..."
              aria-label="Hae ohjeista"
              className="pl-9"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((guide) => (
            <Card key={guide.id} className="bg-[var(--color-surface-2)] border-[var(--color-border)]/50">
              <CardHeader className="flex flex-row items-center gap-2">
                {guide.icon}
                <CardTitle className="text-xl-fluid">{guide.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {guide.items.map((it, idx) => (
                  <div key={idx} className="bg-[var(--color-surface-3)] rounded-lg p-4">
                    <p className="text-sm font-semibold text-primary mb-1">{it.label}</p>
                    <p className="text-sm text-secondary">{it.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/takuu">
            <Button className="h-11 px-6">
              <ShieldCheck className="h-4 w-4 mr-2" />
              Takuu & Palautukset
            </Button>
          </Link>
          <Link href="/yhteystiedot">
            <Button variant="outline" className="h-11 px-6">
              <FileText className="h-4 w-4 mr-2" />
              Yhteystiedot
            </Button>
          </Link>
        </div>

        <p className="text-xs text-[var(--color-text-tertiary)] mt-6 text-center">
          Tarvitsetko lisää apua? Ota yhteyttä – vastaamme mahdollisimman pian.
        </p>
      </section>
    </main>
  );
}


