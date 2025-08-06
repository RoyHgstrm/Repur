'use client';

import { Button } from "~/components/ui/button";
import { 
  RecycleIcon, 
  ShieldCheckIcon, 
  GlobeIcon, 
  StarIcon 
} from "lucide-react";

const values = [
  {
    icon: RecycleIcon,
    title: "Kestävyys",
    description: "Uudelleenkäytetyt premium-pelikoneet ovat ympäristöystävällinen valinta. Vähennämme elektroniikkajätettä ja edistämme kiertotaloutta."
  },
  {
    icon: ShieldCheckIcon,
    title: "Luotettavuus",
    description: "Jokainen pelikone testataan huolellisesti. Tarjoamme 12 kuukauden täystakuun ja ammattitaitoisen asiakaspalvelun."
  },
  {
    icon: GlobeIcon,
    title: "Vastuullisuus",
    description: "Sitoudumme vastuulliseen liiketoimintaan. Tuemme paikallista taloutta ja pyrimme minimoimaan hiilijalanjälkemme."
  },
  {
    icon: StarIcon,
    title: "Laatu",
    description: "Meille laatu tarkoittaa enemmän kuin pelkkää suorituskykyä. Jokainen pelikone on huippukuntoinen ja päivitetty."
  }
];

const teamMembers = [
  {
    name: "Roy Hagström",
    role: "Perustaja & Toimitusjohtaja",
    description: "Intohimoinen pelaaja ja teknologiayrittäjä, joka haluaa tehdä pelaamisesta kestävämpää."
  },
  {
    name: "Sanna Virtanen",
    role: "Tekninen Johtaja",
    description: "Huippuosaaja, joka vastaa pelikoneiden laadunvalvonnasta ja teknisestä kehityksestä."
  },
  {
    name: "Jussi Mäkelä",
    role: "Asiakaspalvelupäällikkö",
    description: "Asiakastyytyväisyys on hänen intohimonsa. Auttaa aina mielellään."
  }
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[var(--color-surface-1)] text-[var(--color-neutral)] py-section">
      <div className="container mx-auto px-container">
        <section className="text-center mb-section">
          <h1 className="text-4xl-fluid font-extrabold tracking-tight text-[var(--color-neutral)] mb-6">
            Repur.fi - Kestävää Pelaamista
          </h1>
          <p className="text-lg-fluid text-[var(--color-neutral)]/80 max-w-3xl mx-auto">
            Olemme nuori, innovatiivinen yritys, joka haluaa mullistaa pelikoneiden markkinat. 
            Uskomme, että huippusuorituskykyiset tietokoneet voivat olla sekä ympäristöystävällisiä että edullisia.
          </p>
        </section>

        <section className="mb-section">
          <h2 className="text-3xl-fluid font-bold text-center text-[var(--color-neutral)] mb-12">
            Arvomme
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value) => (
              <div 
                key={value.title} 
                className="bg-[var(--color-surface-2)] rounded-xl p-6 text-center hover:bg-[var(--color-surface-3)] transition-colors"
              >
                <div className="flex justify-center mb-4">
                  <value.icon className="h-12 w-12 text-[var(--color-primary)]" />
                </div>
                <h3 className="text-xl-fluid font-semibold text-[var(--color-neutral)] mb-4">{value.title}</h3>
                <p className="text-[var(--color-neutral)]/80 text-base-fluid">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-section">
          <h2 className="text-3xl-fluid font-bold text-center text-[var(--color-neutral)] mb-12">
            Tiimimme
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {teamMembers.map((member) => (
              <div 
                key={member.name} 
                className="bg-[var(--color-surface-2)] rounded-xl p-6 text-center hover:bg-[var(--color-surface-3)] transition-colors"
              >
                <div className="w-32 h-32 bg-[var(--color-surface-3)] rounded-full mx-auto mb-6 flex items-center justify-center">
                  <span className="text-[var(--color-neutral)]/50">Kuva</span>
                </div>
                <h3 className="text-xl-fluid font-semibold text-[var(--color-neutral)] mb-2">{member.name}</h3>
                <p className="text-[var(--color-primary)] text-base-fluid mb-4">{member.role}</p>
                <p className="text-[var(--color-neutral)]/80 text-base-fluid">{member.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="text-center">
          <h2 className="text-3xl-fluid font-bold text-[var(--color-neutral)] mb-6">
            Liity Mukaan Kestävään Pelaamiseen
          </h2>
          <p className="text-[var(--color-neutral)]/80 text-lg-fluid mb-8 max-w-2xl mx-auto">
            Haluatko olla osa muutosta? Meillä on aina tilaa intohimoisille osaajille, jotka haluavat tehdä pelaamisesta vastuullisempaa.
          </p>
          <Button size="lg" className="bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white font-bold text-lg-fluid px-8 py-4 transition-colors duration-200">Avoimet Työpaikat</Button>
        </section>
      </div>
    </main>
  );
}