// src/app/takuu/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";

export const metadata: Metadata = {
	title: "Takuu- ja Palautusehdot",
	description:
		"Tutustu Repur.fi:n kattaviin takuu- ja palautusehtoihin. Mielenrauha jokaiselle ostokselle.",
};

export default function TakuuPage() {
	return (
		<main className="min-h-screen bg-surface-1 py-12">
			<section className="mx-auto max-w-4xl px-container py-section space-y-8">
				<header className="text-center space-y-4 mb-8">
					<h1 className="text-4xl-fluid font-extrabold text-primary">
						Takuu- ja Palautusehdot
					</h1>
					<p className="text-lg-fluid text-secondary max-w-3xl mx-auto">
						Tutustu kattaviin ehtoihimme, jotka takaavat huolettoman
						käyttökokemuksen ja turvalliset ostokset.
					</p>
				</header>

				{/* Repur.fi Huoltosopimus */}
				<Card className="bg-surface-2 border-[var(--color-border)]">
					<CardHeader>
						<CardTitle className="text-2xl-fluid font-semibold text-primary">
							Repur.fi Huoltosopimus
						</CardTitle>
					</CardHeader>
					<CardContent className="prose prose-invert max-w-none p-6 space-y-4">
						<p>
							Kaikkiin tietokoneisiimme sisältyy nyt maksutta Repur.fi
							Huoltosopimus rajoitetun ajan. Tavoitteenamme on tarjota
							asiakkaillemme huoleton käyttökokemus ja nopea apu mahdollisissa
							ongelmatilanteissa.
						</p>
						<h3>Huoltosopimus sisältää:</h3>
						<ul className="list-disc list-inside space-y-2">
							<li>
								<strong>1. 12 kuukauden takuu kaikille komponenteille:</strong>{" "}
								Takuu kattaa kaikki laitteen komponentit (esim. prosessori,
								näytönohjain, emolevy, muisti, tallennustila, virtalähde jne.)
								normaalissa käytössä ilmenevien vikojen varalta. Takuu ei
								kuitenkaan kata itse tehtyjä muutoksia tai osien vaihtoa.
							</li>
							<li>
								<strong>2. Etätuki ongelmatilanteissa:</strong> Asiakkaalla on
								oikeus ottaa yhteyttä Repur.fi:n asiakastukeen mahdollisissa
								ohjelmisto- tai laitteisto-ongelmissa. Tarjoamme ohjeistusta ja
								apua etäyhteyden avulla.
							</li>
							<li>
								<strong>3. Ilmainen vianmääritys ja korjaus:</strong> Jos
								tietokoneessa ilmenee vika, asiakas voi toimittaa laitteen
								Repur.fi:lle. Suoritamme vianmäärityksen ja korjauksen
								veloituksetta – myös osien vaihto sisältyy huoltosopimukseen
								takuun puitteissa.
							</li>
							<li>
								<strong>4. Nopeuslupaus: korjaus 2 arkipäivässä:</strong>{" "}
								Sitoudumme siihen, että korjaamme laitteen kahden arkipäivän
								kuluessa sen saapumisesta meille. Mikäli korjaus ei ole
								mahdollinen tässä ajassa, tarjoamme asiakkaalle valinnan:
								<ul className="list-circle list-inside ml-5 mt-2 space-y-1">
									<li>
										Vastaavan tehoinen ja arvoltaan samanlainen korvaava laite
									</li>
									<li>Mahdollisuus purkaa kauppa</li>
								</ul>
							</li>
						</ul>
						<p>
							Huoltosopimus on voimassa 12 kuukautta ostopäivästä ja koskee vain
							kuluttaja-asiakkaita. Tarjous voimassa rajoitetun ajan. Repur.fi
							pidättää oikeuden muuttaa ehtoja.
						</p>
					</CardContent>
				</Card>

				{/* Yleiset takuuehdot */}
				<Card className="bg-surface-2 border-[var(--color-border)] mt-6">
					<CardHeader>
						<CardTitle className="text-2xl-fluid font-semibold text-primary">
							Yleiset takuuehdot
						</CardTitle>
					</CardHeader>
					<CardContent className="prose prose-invert max-w-none p-6 space-y-4">
						<p>
							Tarjoamme kaikille tuotteillemme 12kk kestävän tekniset viat
							kattavan takuun.
						</p>
						<p>
							Ennen koneesi lähettämistä takuuseen, ota yhteyttä
							asiakaspalveluumme ja kuvaile tilanteesi. Asiakaspalvelumme antaa
							sinulle ohjeet, kuinka toimia tilanteessa.
						</p>
						<p>
							Takuu kattaa tekniset viat, mutta ei fyysisiä vahinkoja tai niiden
							seurauksena aiheutuneita ongelmia.
						</p>
						<p>
							Viat, jotka ilmenevät virheellisen käytön johdosta, kuten
							tietokoneen pudotessa, kastuessa, vääntyessä tai lian/muun
							vastaavan ulkopuolisen materiaalin joutuminen tietokoneen sisään
							eivät kuulu takuun piiriin.
						</p>
						<p>
							Virheen ilmetessä, pyrimme korjaamaan koneesi alkuperäiseen
							kuntoon, ja mikäli tämä ei ole mahdollista, tarjoamme sinulle
							uuden vastaavan laitteen. Takuukorjauksen kesto riippuu
							tapauskohtaisesti mutta pyrimme toteuttamaan sen saman viikon
							aikana, kun vastaanotamme vioittuneen koneen. Pidätämme oikeuden
							muuttaa näitä ehtoja aika ajoin ilman, että ilmoitamme muutoksista
							sinulle ennakkoon.
						</p>
					</CardContent>
				</Card>

				{/* Palautusehdot */}
				<Card className="bg-surface-2 border-[var(--color-border)] mt-6">
					<CardHeader>
						<CardTitle className="text-2xl-fluid font-semibold text-primary">
							Palautusehdot
						</CardTitle>
					</CardHeader>
					<CardContent className="prose prose-invert max-w-none p-6 space-y-4">
						<p>
							Tarjoamme kaikille tuotteillemme 14pv palautusoikeuden. Mikäli
							tuotteessa on vika tai olet tyytymätuotteeseesi, ota yhteyttä
							asiakaspalveluumme ja kuvaile tilanteesi. Asiakaspalvelumme antaa
							sinulle ohjeet, kuinka toimia tilanteessa.
						</p>
					</CardContent>
				</Card>

				<div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
					<Link href="/tuki">
						<Button className="h-11 px-6">Tee tukipyyntö</Button>
					</Link>
					<Link href="/yhteystiedot">
						<Button variant="outline" className="h-11 px-6">
							Yhteystiedot
						</Button>
					</Link>
				</div>
			</section>
		</main>
	);
}
