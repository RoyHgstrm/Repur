// src/app/yhteystiedot/page.tsx
import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import { User, Mail } from "lucide-react"; // Importing icons for contact info

/**
 * @comment
 * Metadata for the Yhteystiedot (Contact) page. Sets the title and description for SEO purposes.
 * The title is in Finnish as per localization rules.
 */
export const metadata: Metadata = {
	title: "Yhteystiedot - Repur.fi",
	description:
		"Ota yhteyttä Repur.fi-asiakaspalveluun sähköpostitse tai tutustu usein kysyttyihin kysymyksiin ja tukimateriaaleihin.",
};

/**
 * @comment
 * Renders the Contact page (YhteystiedotPage) for Repur.fi. This page provides contact information primarily via email,
 * along with links to support and warranty pages, FAQs, and social media. The layout is designed to be modern
 * and responsive using Tailwind CSS, adhering to Finnish-first language rules.
 */
export default function YhteystiedotPage() {
	return (
		<div className="container mx-auto px-container py-section min-h-screen flex flex-col items-center justify-center">
			{/* Page Header */}
			<header className="text-center mb-12">
				<h1 className="text-4xl-fluid font-bold text-text-primary mb-4">
					Yhteystiedot
				</h1>
				<p className="text-lg-fluid text-text-secondary max-w-2xl mx-auto">
					Olemme täällä auttaaksemme sinua! Voit ottaa meihin yhteyttä
					sähköpostitse.
				</p>
			</header>

			{/* Additional Contact Information and Support Links */}
			<div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
				<Card className="w-full bg-surface-2 border-[var(--color-border-light)] shadow-lg rounded-xl p-4 sm:p-6 text-center">
					<CardHeader className="mb-4 p-0">
						<CardTitle className="text-xl sm:text-2xl-fluid font-semibold text-text-primary flex flex-col sm:flex-row items-center justify-center gap-2">
							<Mail className="h-6 w-6 sm:h-7 sm:w-7 text-accent-primary" />
							Sähköposti
						</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						<p className="text-sm sm:text-base-fluid text-text-secondary mb-4">
							Lähetä meille sähköpostia osoitteeseen:
						</p>
						<a
							href="mailto:info@repur.fi"
							className="text-lg sm:text-xl-fluid font-bold text-accent-primary hover:underline transition-colors break-all sm:break-normal"
						>
							asiakaspalvelu@repur.fi
						</a>
					</CardContent>
				</Card>
				{/* Support and Warranty Card */}
				<Card className="w-full bg-surface-2 border-[var(--color-border-light)] shadow-lg rounded-xl p-4 sm:p-6">
					<CardHeader className="mb-4 p-0">
						<CardTitle className="text-lg sm:text-xl font-semibold flex flex-col sm:flex-row items-center sm:items-start gap-2 text-text-primary text-center sm:text-left">
							<User className="h-5 w-5 sm:h-6 sm:w-6 text-accent-primary" />
							Tuki ja takuu
						</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						<p className="text-sm sm:text-base-fluid text-text-secondary text-center sm:text-left">
							Tarvitsetko apua laitteesi kanssa tai onko sinulla kysyttävää
							takuusta?
						</p>
						<div className="mt-4 flex flex-col sm:flex-row flex-wrap items-center justify-center sm:justify-start gap-3">
							{/* Links to support and warranty pages */}
							<Link href="/tuki" passHref>
								<Button className="w-full sm:w-auto h-10 px-5">Tuki</Button>
							</Link>
							<Link href="/takuu" passHref>
								<Button
									variant="outline"
									className="w-full sm:w-auto h-10 px-5"
								>
									Takuu
								</Button>
							</Link>
						</div>
					</CardContent>
				</Card>

				{/* FAQ + Social Media Section (kept as general info) */}
				<div className="md:col-span-2 mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* FAQ Card */}
					<Card className="bg-gradient-to-br from-surface-2 to-surface-3 border-none shadow-xl rounded-2xl overflow-hidden">
						<CardHeader className="bg-surface-1/70 px-6 py-4 border-b border-[var(--color-border-light)]">
							<CardTitle className="text-lg font-semibold flex items-center gap-2">
								{/* Icon for FAQ */}
								<span className="inline-block bg-[var(--color-primary)]/10 rounded-full p-2">
									<svg
										className="h-5 w-5 text-[var(--color-primary)]"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										viewBox="0 0 24 24"
									>
										<path d="M12 19v.01M12 17a5 5 0 1 0-5-5" />
									</svg>
								</span>
								Usein kysyttyä
							</CardTitle>
						</CardHeader>
						<CardContent className="p-6">
							<ul className="space-y-3 text-base text-text-secondary">
								{/* FAQ links */}
								<li>
									<Link
										href="/tuki/ukk"
										className="group flex items-center gap-2 transition-colors hover:text-[var(--color-primary)]"
									>
										<span className="inline-block w-2 h-2 bg-[var(--color-primary)] rounded-full group-hover:scale-125 transition-transform" />
										Miten takuu toimii?
									</Link>
								</li>
								<li>
									<Link
										href="/tuki/ukk"
										className="group flex items-center gap-2 transition-colors hover:text-[var(--color-primary)]"
									>
										<span className="inline-block w-2 h-2 bg-[var(--color-primary)] rounded-full group-hover:scale-125 transition-transform" />
										Voinko päivittää tietokoneen itse?
									</Link>
								</li>
								<li>
									<Link
										href="/tuki/ukk"
										className="group flex items-center gap-2 transition-colors hover:text-[var(--color-primary)]"
									>
										<span className="inline-block w-2 h-2 bg-[var(--color-primary)] rounded-full group-hover:scale-125 transition-transform" />
										Mitä maksutapoja hyväksytte?
									</Link>
								</li>
								<li>
									<Link
										href="/tuki/ukk"
										className="group flex items-center gap-2 transition-colors hover:text-[var(--color-primary)]"
									>
										<span className="inline-block w-2 h-2 bg-[var(--color-primary)] rounded-full group-hover:scale-125 transition-transform" />
										Kuinka toimitus tapahtuu?
									</Link>
								</li>
							</ul>
							<div className="mt-6 text-center">
								<Link href="/tuki/ukk" passHref>
									<Button variant="outline" className="mt-4">
										Katso kaikki UKK
									</Button>
								</Link>
							</div>
						</CardContent>
					</Card>

					{/* Social Media Card */}
					<Card className="bg-gradient-to-br from-surface-2 to-surface-3 border-none shadow-xl rounded-2xl overflow-hidden">
						<CardHeader className="bg-surface-1/70 px-6 py-4 border-b border-[var(--color-border-light)]">
							<CardTitle className="text-lg font-semibold flex items-center gap-2">
								{/* Icon for Social Media */}
								<span className="inline-block bg-[var(--color-primary)]/10 rounded-full p-2">
									<svg
										className="h-5 w-5 text-[var(--color-primary)]"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										viewBox="0 0 24 24"
									>
										<path d="M17 2a2 2 0 00-2 2v2H9V4a2 2 0 00-2-2H4a2 2 0 00-2 2v16a2 2 0 002 2h3a2 2 0 002-2v-2h6v2a2 2 0 002 2h3a2 2 0 002-2V4a2 2 0 00-2-2h-3zM7 10h10M7 14h10" />
									</svg>
								</span>
								Seuraa meitä
							</CardTitle>
						</CardHeader>
						<CardContent className="p-6">
							<p className="text-base-fluid text-text-secondary">
								Pysy ajan tasalla uutisista, tarjouksista ja tapahtumista
								sosiaalisen median kanavissamme.
							</p>
							<div className="mt-4 flex flex-wrap gap-3">
								{/* Placeholder social media links - Replace with actual links and icons */}
								<Button variant="outline" className="flex items-center gap-2">
									Facebook
								</Button>
								<Button variant="outline" className="flex items-center gap-2">
									Instagram
								</Button>
								<Button variant="outline" className="flex items-center gap-2">
									Twitter
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
