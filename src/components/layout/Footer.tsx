import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin, Mail } from "lucide-react";
import Image from "next/image";

/**
 * Modern Footer with newsletter, social links and consistent spacing.
 * Follows the site's gradient accents and typography.
 */
export default function Footer() {
	return (
		<footer className="border-t border-[var(--color-border)] bg-[var(--color-surface-1)]">
			<div className="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-section">
				{/* Top CTA */}
				<div className="mb-10 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-6 sm:p-8 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
					<div>
						<h2 className="text-xl-fluid font-semibold text-[var(--color-neutral)]">
							Tarvitsetko apua oikean koneen valintaan?
						</h2>
						<p className="text-[var(--color-text-secondary)]">
							Ota yhteyttä – autamme mielellämme.
						</p>
					</div>
					<Link href="/yhteystiedot" className="inline-flex">
						<span className="inline-flex items-center gap-2 rounded-lg px-4 py-2 bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary)]/90 transition-colors">
							<Mail className="h-4 w-4" /> Ota yhteyttä
						</span>
					</Link>
				</div>

				{/* Columns */}
				<div className="grid grid-cols-1 gap-10 md:grid-cols-4">
					{/* Logo and Description */}
					<div className="space-y-4">
						<div className="flex items-center gap-3">
							<Image
								src="/repur-fi-4-min.png"
								alt="Repur.fi Logo"
								width={72} // Adjusted width for better fit, original was not explicit but img had h-18 which is 72px
								height={72} // Adjusted height to match width and h-18
								className="h-18 w-auto object-contain"
							/>
						</div>
						<p className="text-secondary">
							Kestävää ja luotettavaa suorituskykyä – uudelleenkäytetyt
							premium-pelikoneet.
						</p>
					</div>

					{/* Tuotteet */}
					<div>
						<h3 className="text-xl-fluid mb-4 font-semibold text-primary">
							Tuotteet
						</h3>
						<ul className="space-y-2">
							<li>
								<Link
									href="/osta"
									className="text-secondary hover:text-primary"
								>
									Osta
								</Link>
							</li>
							<li>
								<Link href="/myy" className="text-secondary hover:text-primary">
									Myy Koneesi
								</Link>
							</li>
						</ul>
					</div>

					{/* Tuki */}
					<div>
						<h3 className="text-xl-fluid mb-4 font-semibold text-primary">
							Tuki
						</h3>
						<ul className="space-y-2">
							<li>
								<Link
									href="/tuki"
									className="text-secondary hover:text-primary"
								>
									Asiakastuki
								</Link>
							</li>
							<li>
								<Link
									href="/takuu"
									className="text-secondary hover:text-primary"
								>
									Takuu
								</Link>
							</li>
							<li>
								<Link
									href="/yhteystiedot"
									className="text-secondary hover:text-primary"
								>
									Yhteystiedot
								</Link>
							</li>
						</ul>
					</div>

					{/* Yritys */}
					<div>
						<h3 className="text-xl-fluid mb-4 font-semibold text-primary">
							Yritys
						</h3>
						<ul className="space-y-2">
							<li>
								<Link
									href="/meista"
									className="text-secondary hover:text-primary"
								>
									Meistä
								</Link>
							</li>
							<li>
								<Link
									href="/kayttoehdot"
									className="text-secondary hover:text-primary"
								>
									Käyttöehdot
								</Link>
							</li>
							<li>
								<Link
									href="/tietosuoja"
									className="text-secondary hover:text-primary"
								>
									Tietosuojakäytäntö
								</Link>
							</li>
						</ul>
					</div>
				</div>

				{/* Bottom bar */}
				<div className="mt-12 flex flex-col items-center justify-between border-t border-[var(--color-border)] pt-8 md:flex-row">
					<p className="text-sm text-secondary">
						© {new Date().getFullYear()} Repur.fi. Kaikki oikeudet pidätetään.
					</p>
					<div className="mt-4 flex gap-4 md:mt-0">
						<Link
							href="#"
							className="text-[var(--color-neutral)]/70 hover:text-[var(--color-neutral)] drop-shadow-sm"
							aria-label="Facebook"
						>
							<Facebook className="h-5 w-5" />
						</Link>
						<Link
							href="#"
							className="text-[var(--color-neutral)]/70 hover:text-[var(--color-neutral)] drop-shadow-sm"
							aria-label="Twitter"
						>
							<Twitter className="h-5 w-5" />
						</Link>
						<Link
							href="#"
							className="text-[var(--color-neutral)]/70 hover:text-[var(--color-neutral)] drop-shadow-sm"
							aria-label="Instagram"
						>
							<Instagram className="h-5 w-5" />
						</Link>
						<Link
							href="#"
							className="text-[var(--color-neutral)]/70 hover:text-[var(--color-neutral)] drop-shadow-sm"
							aria-label="LinkedIn"
						>
							<Linkedin className="h-5 w-5" />
						</Link>
					</div>
				</div>
			</div>
		</footer>
	);
}
