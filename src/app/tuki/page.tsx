import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Phone, Mail, MessageCircle, BookOpenText, ShieldCheck, Truck } from "lucide-react";

export default function SupportPage() {
  const supportCards = [
    { Icon: MessageCircle, title: "UKK", desc: "Vastaukset yleisimpiin kysymyksiin", href: "/tuki/ukk" },
    { Icon: Mail, title: "Sähköpostituki", desc: "asiakaspalvelu@repur.fi", href: "mailto:asiakaspalvelu@repur.fi" },
    { Icon: Phone, title: "Puhelintuki", desc: "Arkisin klo 9–17", href: "tel:+358123456789" },
    { Icon: BookOpenText, title: "Ohjeet", desc: "Käyttö- ja asennusohjeet", href: "/tuki/ohjeet" },
  ];

  const faqs = [
    { q: "Mikä takuu koneilla on?", a: "Kaikilla koneilla 12 kuukauden takuu. Katso tarkemmin /takuu." },
    { q: "Miten teen takuupyynnön?", a: "Täytä tukipyyntö /tuki tai ota yhteyttä /yhteystiedot – autamme ohjein ja palautuksissa." },
    { q: "Milloin tilaus lähetetään?", a: "Lähetämme viimeistään seuraavana arkipäivänä. Toimitus on ilmainen." },
  ];

  return (
    <main className="min-h-screen bg-surface-1">
      <section className="mx-auto max-w-7xl px-container py-12">
        <header className="text-center space-y-4 mb-8">
          <h1 className="text-4xl-fluid font-extrabold text-primary">Asiakastuki</h1>
          <p className="text-lg-fluid text-secondary max-w-2xl mx-auto">Nopea apu tilauksiin, takuuseen ja teknisiin kysymyksiin.</p>
        </header>

        {/* Entry points */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {supportCards.map(({ Icon, title, desc, href }) => (
            <Link key={title} href={href} className="group">
              <Card className="bg-surface-2 border-[var(--color-border-light)] group-hover:border-[var(--color-primary)]/40 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-[var(--color-primary)] group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="text-sm font-semibold text-primary">{title}</p>
                      <p className="text-sm text-secondary">{desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* FAQs */}
        <Card className="bg-surface-2 border-[var(--color-border-light)] mb-10">
          <CardHeader>
            <CardTitle className="text-xl-fluid">Usein kysytyt kysymykset</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {faqs.map(({ q, a }, i) => (
              <div key={i} className="bg-surface-3 rounded-lg p-4">
                <p className="text-sm font-semibold text-primary mb-1">{q}</p>
                <p className="text-sm text-secondary">{a}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Warranty & shipping quick links */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-surface-2 border-[var(--color-border-light)]">
            <CardContent className="p-6 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-[var(--color-primary)]" />
              <div>
                <p className="text-sm">Takuuasiat ja ohjeet löytyvät selkeästi koottuna.</p>
                <div className="mt-2">
                  <Link href="/takuu"><Button className="h-10 px-5">Takuu</Button></Link>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-surface-2 border-[var(--color-border-light)]">
            <CardContent className="p-6 flex items-start gap-3">
              <Truck className="h-5 w-5 text-[var(--color-primary)]" />
              <div>
                <p className="text-sm">Toimitus on ilmainen. Lähetämme viimeistään seuraavana arkipäivänä.</p>
                <div className="mt-2">
                  <Link href="/osta"><Button variant="outline" className="h-10 px-5">Selaa koneita</Button></Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}