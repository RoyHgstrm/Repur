"use client";

import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
	ShieldCheck,
	Recycle,
	Wrench,
	Gauge,
	Truck,
	CheckCircle,
	Gamepad2,
} from "lucide-react";

export default function AboutPage() {
	return (
		<main className="min-h-screen bg-[var(--color-surface-1)] text-[var(--color-neutral)]">
			{/* Hero */}
			<section className="relative overflow-hidden">
				<div className="mx-auto max-w-7xl px-container py-16 sm:py-20 lg:py-24">
					<div className="text-center space-y-6">
						<h1 className="text-4xl-fluid font-extrabold tracking-tight text-[var(--color-neutral)]">
							Huipputeknologia pelaajille – kestävästi ja luotettavasti
						</h1>
						<p className="text-lg-fluid text-[var(--color-neutral)]/80 max-w-3xl mx-auto">
							Repur.fi kunnostaa ja myy premium‑pelikoneita Suomessa. Rakennamme
							jokaisen koneen testatusti, tarjoamme 12 kuukauden takuun ja
							pidämme hinnat reiluina – ilman turhaa hiostusta tai piilokuluja.
						</p>
						<div className="flex items-center justify-center gap-3">
							<Link href="/osta">
								<Button className="h-11 px-6">Osta kone</Button>
							</Link>
							<Link href="/myy">
								<Button variant="outline" className="h-11 px-6">
									Myy koneesi
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* Trust highlights */}
			<section className="mx-auto max-w-7xl px-container pb-12">
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					{[
						{
							Icon: ShieldCheck,
							title: "12 kuukauden takuu",
							desc: "Kattava suoja kaikille komponenteille",
						},
						{
							Icon: Wrench,
							title: "Huolellinen kunnostus",
							desc: "Täysi purku, puhdistus ja uudet tahnat",
						},
						{
							Icon: Gauge,
							title: "Testattu suorituskyky",
							desc: "Jokainen kone kuormitustestataan",
						},
						{
							Icon: Truck,
							title: "Ilmainen toimitus",
							desc: "Nopea ja turvallinen toimitus Suomessa",
						},
					].map(({ Icon, title, desc }) => (
						<Card
							key={title}
							className="bg-surface-2 border-[var(--color-border-light)]"
						>
							<CardContent className="p-5 flex items-start gap-3">
								<Icon className="h-5 w-5 text-[var(--color-primary)]" />
								<div>
									<p className="text-sm font-semibold text-[var(--color-neutral)]">
										{title}
									</p>
									<p className="text-sm text-[var(--color-neutral)]/70">
										{desc}
									</p>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</section>

			{/* How we work */}
			<section className="mx-auto max-w-7xl px-container py-8">
				<div className="space-y-3 text-center">
					<h2 className="text-3xl-fluid font-bold">Miten toimimme</h2>
					<p className="text-[var(--color-neutral)]/80 max-w-3xl mx-auto">
						Jokainen kone käy läpi saman laadunvarmistusketjun – läpinäkyvästi
						ja dokumentoidusti.
					</p>
				</div>
				<div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					{[
						{
							step: "Vastaanotto",
							desc: "Tarkistamme rungon, osat ja historian",
						},
						{
							step: "Kunnostus",
							desc: "Puhdistus, uudet lämpötahnat ja tarvittavat päivitykset",
						},
						{
							step: "Testaus",
							desc: "CPU/GPU, muistit ja tallennus – kuormitustestit ja seuranta",
						},
						{
							step: "Toimitus",
							desc: "Pakataan turvallisesti ja lähetetään nopeasti",
						},
					].map(({ step, desc }) => (
						<Card
							key={step}
							className="bg-surface-2 border-[var(--color-border-light)]"
						>
							<CardContent className="p-6 space-y-1">
								<p className="text-sm font-semibold text-[var(--color-neutral)]">
									{step}
								</p>
								<p className="text-sm text-[var(--color-neutral)]/70">{desc}</p>
							</CardContent>
						</Card>
					))}
				</div>
			</section>

			{/* Why repur */}
			<section className="mx-auto max-w-7xl px-container py-8">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
					<Card className="bg-surface-2 border-[var(--color-border-light)]">
						<CardContent className="p-6 space-y-3">
							<h3 className="text-xl-fluid font-bold">Miksi Repur.fi?</h3>
							<ul className="space-y-2 text-sm">
								<li className="flex items-center gap-2">
									<CheckCircle className="h-4 w-4 text-[var(--color-success)]" />{" "}
									Selkeä hinnoittelu – ei piilokuluja
								</li>
								<li className="flex items-center gap-2">
									<CheckCircle className="h-4 w-4 text-[var(--color-success)]" />{" "}
									Rehelliset speksit ja kuvaukset
								</li>
								<li className="flex items-center gap-2">
									<CheckCircle className="h-4 w-4 text-[var(--color-success)]" />{" "}
									Nopea, ystävällinen asiakastuki
								</li>
								<li className="flex items-center gap-2">
									<CheckCircle className="h-4 w-4 text-[var(--color-success)]" />{" "}
									Kestävä valinta – koneille pidempi elinkaari
								</li>
							</ul>
						</CardContent>
					</Card>
					<Card className="bg-surface-2 border-[var(--color-border-light)]">
						<CardContent className="p-6 space-y-3">
							<h3 className="text-xl-fluid font-bold">
								Pelaajille suunniteltu
							</h3>
							<p className="text-sm text-[var(--color-neutral)]/80">
								Rakennamme koneet todellista käyttöä varten. Mittaamme
								suorituskykyä ja tarkistamme lämpötilat sekä melutason – jotta
								voit pelata rauhassa. Löydät arvioidut FPS-luvut tuotesivuilla
								selkeästi esitettynä.
							</p>
							<div className="flex items-center gap-2 text-sm text-[var(--color-neutral)]/80">
								<Gamepad2 className="h-4 w-4 text-[var(--color-accent)]" />
								Katso valikoima ja FPS-arviot:{" "}
								<Link
									href="/osta"
									className="text-[var(--color-primary)] hover:underline"
								>
									/osta
								</Link>
							</div>
						</CardContent>
					</Card>
				</div>
			</section>

			{/* Sustainability note */}
			<section className="mx-auto max-w-7xl px-container py-8">
				<Card className="bg-surface-2 border-[var(--color-border-light)]">
					<CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
						<div className="flex items-center gap-3">
							<Recycle className="h-5 w-5 text-[var(--color-primary)]" />
							<p className="text-sm text-[var(--color-neutral)]/80">
								Kunnostamalla pidennämme laitteiden elinkaarta ja vähennämme
								tarpeetonta e‑jätettä.
							</p>
						</div>
						<div className="flex items-center gap-3">
							<ShieldCheck className="h-5 w-5 text-[var(--color-success)]" />
							<p className="text-sm text-[var(--color-neutral)]/80">
								Kaikilla koneilla 12 kuukauden takuu
							</p>
						</div>
					</CardContent>
				</Card>
			</section>

			{/* CTA */}
			<section className="mx-auto max-w-7xl px-container py-12">
				<div className="flex flex-col sm:flex-row items-center justify-center gap-3">
					<Link href="/osta">
						<Button className="h-11 px-6">Selaa koneita</Button>
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
