"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import { ShieldCheck, Truck, Search, Info, Package, Wrench, Cpu, Gauge } from "lucide-react";
import type { ReactNode } from "react";
import CollapsibleComponent from "~/components/ui/CollapsibleComponent";

type FAQ = { q: string; a: string };
type FAQCategory = {
  id: string;
  title: string;
  icon: ReactNode;
  faqs: FAQ[];
};

export default function UKKPage() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string>("all");

  const categories: FAQCategory[] = useMemo(
    () => [
      {
        id: "delivery",
        title: "Tilaus ja toimitus",
        icon: <Truck className="h-5 w-5 text-[var(--color-primary)]" />,
        faqs: [
          { q: "Onko toimitus ilmainen?", a: "Kyllä, toimitus on ilmainen Suomessa." },
          { q: "Milloin tilaus lähetetään?", a: "Lähetämme tilaukset viimeistään seuraavana arkipäivänä." },
          { q: "Saanko seurantakoodin?", a: "Kyllä. Saat seurantakoodin sähköpostitse, kun paketti on matkalla." },
        ],
      },
      {
        id: "warranty",
        title: "Takuu ja palautus",
        icon: <ShieldCheck className="h-5 w-5 text-[var(--color-success)]" />,
        faqs: [
          { q: "Mikä on takuuaika?", a: "12 kuukautta kaikille tuotteille. Lisätiedot sivulla /takuu." },
          { q: "Voinko palauttaa tuotteen?", a: "Kyllä. 14 päivän palautusoikeus alkuperäisessä kunnossa ja pakkauksessa." },
          { q: "Miten teen takuupyynnön?", a: "Ota yhteyttä sivun /yhteystiedot kautta – ohjaamme vianmäärityksessä ja palautuksessa." },
        ],
      },
      {
        id: "usage",
        title: "Käyttö ja sisältö",
        icon: <Package className="h-5 w-5 text-[var(--color-accent)]" />,
        faqs: [
          { q: "Onko Windows asennettu?", a: "Kyllä, koneissa on Windows ja ajurit valmiina." },
          { q: "Mitä paketissa tulee?", a: "Tietokone, virtajohto ja tarvittavat kaapelit. Mahdolliset lisävarusteet on mainittu tuotesivulla." },
        ],
      },
      {
        id: "tech",
        title: "Tekniikka ja suorituskyky",
        icon: <Gauge className="h-5 w-5 text-[var(--color-warning)]" />,
        faqs: [
          { q: "Mistä näen suorituskyvyn?", a: "Tuotesivuilla on arvioitu FPS ja komponenttitiedot." },
          { q: "Voinko päivittää osia?", a: "Kyllä, useimmat koneet ovat päivitettävissä. Kysy tarvittaessa neuvoa asiakastuesta." },
        ],
      },
      {
        id: "support",
        title: "Tuki ja yhteydenotto",
        icon: <Wrench className="h-5 w-5 text-[var(--color-tertiary)]" />,
        faqs: [
          { q: "Mistä saan apua?", a: "Katso /tuki/ohjeet ja ota yhteyttä /yhteystiedot – vastaamme mahdollisimman pian." },
          { q: "Voinko saada neuvontaa ostoon?", a: "Kyllä. Autamme valitsemaan sopivan kokoonpanon tarpeisiisi." },
        ],
      },
    ],
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const source = active === "all" ? categories : categories.filter((c) => c.id === active);
    if (!q) return source;
    return source
      .map((c) => ({ ...c, faqs: c.faqs.filter((f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)) }))
      .filter((c) => c.faqs.length > 0);
  }, [categories, query, active]);

  return (
    <main className="min-h-screen bg-[var(--color-surface-1)] text-[var(--color-text-primary)]">
      <section className="mx-auto max-w-5xl px-container py-section">
        <header className="text-center space-y-4 mb-6">
          <h1 className="text-4xl-fluid font-extrabold">Usein kysytyt kysymykset</h1>
          <p className="text-sm-fluid text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            Kompakti UKK – etsi vastaukset toimituksesta, takuusta ja käytöstä.
          </p>
        </header>

        {/* Search */}
        <div className="mx-auto max-w-3xl mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Hae UKK:sta..."
              aria-label="Hae UKK:sta"
              className="pl-9"
            />
          </div>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {[
            { id: "all", title: "Kaikki" },
            ...categories.map((c) => ({ id: c.id, title: c.title })),
          ].map((c) => (
            <Button
              key={c.id}
              variant={active === c.id ? "default" : "outline"}
              size="sm"
              className="h-8 px-3"
              onClick={() => setActive(c.id)}
            >
              {c.title}
            </Button>
          ))}
        </div>

        {/* Compact accordions */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-[var(--color-text-tertiary)]">Ei tuloksia haulla.</p>
          ) : (
            filtered.map((cat) => (
              <Card key={cat.id} className="bg-[var(--color-surface-2)] border-[var(--color-border)]/50">
                <CardHeader className="py-3 flex flex-row items-center gap-2">
                  {cat.icon}
                  <CardTitle className="text-base-fluid">{cat.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-[var(--color-border)]/50">
                    {cat.faqs.map((f, i) => (
                      <CollapsibleComponent
                        key={i}
                        title={f.q}
                        icon={<Cpu className="h-4 w-4 text-[var(--color-primary)]" />}
                        defaultOpen={false}
                      >
                        <p className="text-sm text-[var(--color-text-secondary)] pr-2">{f.a}</p>
                      </CollapsibleComponent>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/takuu">
            <Button className="h-10 px-5">
              <ShieldCheck className="h-4 w-4 mr-2" />
              Takuu & Palautukset
            </Button>
          </Link>
          <Link href="/tuki/ohjeet">
            <Button variant="outline" className="h-10 px-5">
              <Truck className="h-4 w-4 mr-2" />
              Ohjeet
            </Button>
          </Link>
          <Link href="/yhteystiedot">
            <Button variant="outline" className="h-10 px-5">
              <Info className="h-4 w-4 mr-2" />
              Yhteystiedot
            </Button>
          </Link>
        </div>

        <p className="text-xs text-[var(--color-text-tertiary)] mt-6 text-center">
          Päivitämme UKK-sisältöä säännöllisesti pysyäksemme ajantasalla.
        </p>
      </section>
    </main>
  );
}


