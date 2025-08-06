import { Button } from "~/components/ui/button";
import { 
  PhoneIcon, 
  MailIcon, 
  MessageCircleIcon,
  BookIcon
} from "lucide-react";

const supportOptions = [
  {
    icon: MessageCircleIcon,
    title: "Usein Kysytyt Kysymykset",
    description: "Löydä nopeasti vastaukset yleisimpiin kysymyksiin",
    link: "/tuki/faq"
  },
  {
    icon: PhoneIcon,
    title: "Asiakastuki",
    description: "Ota yhteyttä ammattitaitoiseen tukihenkilöstöömme",
    link: "/tuki/yhteystiedot"
  },
  {
    icon: MailIcon,
    title: "Sähköpostituki",
    description: "Lähetä meille sähköpostia, vastaamme nopeasti",
    link: "mailto:tuki@repur.fi"
  },
  {
    icon: BookIcon,
    title: "Käyttöohjeet",
    description: "Tutustu pelikoneiden käyttöohjeisiin ja manuaaleihin",
    link: "/tuki/kayttoohjeet"
  }
];

const faqItems = [
  {
    question: "Mikä takuu Repur.fi:n koneilla on?",
    answer: "Kaikilla Repur.fi:n pelikoneilla on 12 kuukauden täystakuu, joka kattaa kaikki komponentit."
  },
  {
    question: "Voinko räätälöidä oman pelikoneeni?",
    answer: "Kyllä! Voit räätälöidä oman pelikoneesi valitsemalla haluamasi komponentit."
  },
  {
    question: "Mitä tarkoittaa uudelleenkäytetty premium-pelikone?",
    answer: "Uudelleenkäytetyt premium-pelikoneet ovat huippukuntoisia, testattuja ja päivitettyjä tietokoneita, jotka ovat ympäristöystävällinen vaihtoehto."
  }
];

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-[var(--color-surface-1)] text-[var(--color-neutral)] py-section">
      <div className="container mx-auto px-container">
        <h1 className="text-4xl-fluid font-bold mb-12 text-center text-[var(--color-neutral)]">
          Asiakastuki
        </h1>

        <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {supportOptions.map((option) => (
            <a 
              key={option.title} 
              href={option.link} 
              className="bg-[var(--color-surface-2)] rounded-xl p-6 hover:bg-[var(--color-surface-3)] transition-colors group"
            >
              <div className="flex items-center mb-4">
                <option.icon className="h-8 w-8 mr-4 text-[var(--color-primary)] group-hover:scale-110 transition-transform" />
                <h2 className="text-xl-fluid font-semibold text-[var(--color-neutral)]">{option.title}</h2>
              </div>
              <p className="text-[var(--color-neutral)]/80">{option.description}</p>
            </a>
          ))}
        </section>

        <section className="bg-[var(--color-surface-2)] rounded-xl p-8 mb-16">
          <h2 className="text-3xl-fluid font-bold mb-8 text-center text-[var(--color-neutral)]">
            Usein Kysytyt Kysymykset
          </h2>
          <div className="space-y-6">
            {faqItems.map((item, index) => (
              <div 
                key={index} 
                className="bg-[var(--color-surface-3)] rounded-lg p-6 hover:bg-[var(--color-surface-2)] transition-colors"
              >
                <h3 className="text-xl-fluid font-semibold mb-4 text-[var(--color-primary)]">
                  {item.question}
                </h3>
                <p className="text-[var(--color-neutral)]/80">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="text-center">
          <h2 className="text-3xl-fluid font-bold mb-6 text-[var(--color-neutral)]">
            Eikö löytynyt vastausta?
          </h2>
          <p className="text-[var(--color-neutral)]/80 mb-8 max-w-2xl mx-auto">
            Autamme mielellämme. Voit ottaa yhteyttä asiakaspalveluumme puhelimitse, sähköpostitse tai chat-tuessa.
          </p>
          <div className="flex justify-center space-x-4">
            <Button size="lg">Ota Yhteyttä</Button>
            <Button variant="outline" size="lg">Chat-tuki</Button>
          </div>
        </section>
      </div>
    </main>
  );
}