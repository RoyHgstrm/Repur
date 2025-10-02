"use client";

import { Button } from "~/components/ui/button";
// Removed unused Card imports to satisfy lint rules
import Image from "next/image"; // Import Image component
import {
	ArrowRight,
	CheckCircle2,
	Recycle,
	ShieldCheck,
	ShoppingCart,
	Wrench,
	Zap,
	Euro,
	Award,
	TrendingUp,
	Sparkles,
	Truck,
} from "lucide-react";
import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "~/lib/utils";
import { ProductCard as ListingCard } from "~/components/features/ProductCard";
import Link from "next/link";

type ListingWithSeller =
	RouterOutputs["listings"]["getActiveCompanyListings"][number];

const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { staggerChildren: 0.05, delayChildren: 0.05 },
	},
};

const itemVariants = {
	hidden: { y: 12, opacity: 0 },
	visible: { y: 0, opacity: 1 },
};

// Hero featured listing carousel (uses listings from the page query)
// HOW: This component displays a rotating carousel of featured product listings.
// WHY: It captures user attention with visually appealing products and drives engagement with key listings.
const HeroFeaturedCarousel = ({ items }: { items: ListingWithSeller[] }) => {
	const [current, setCurrent] = React.useState(0);
	const [imgAspect, setImgAspect] = React.useState<number | null>(null);
	const hasMany = items.length > 1;

	React.useEffect(() => {
		if (!hasMany) return;
		const t = setInterval(
			() => setCurrent((p) => (p + 1) % items.length),
			5000,
		);
		return () => clearInterval(t);
	}, [items.length, hasMany]);

	if (!items.length) {
		return (
			<div className="rounded-2xl border border-[var(--color-border)]/30 bg-[var(--color-surface-2)]/40 p-6 h-full">
				<div className="h-64 w-full rounded-xl bg-[var(--color-surface-3)] animate-pulse" />
				<div className="h-4 w-2/3 mt-4 rounded bg-[var(--color-surface-3)] animate-pulse" />
				<div className="h-3 w-1/2 mt-2 rounded bg-[var(--color-surface-3)] animate-pulse" />
			</div>
		);
	}

	const product = items[current];
	const imageUrl = (product.images && product.images[0]) || undefined;
	const price = Number(product.basePrice);
	const discountAmountNum = Number((product as any).discountAmount ?? 0);
	const hasDiscount =
		Number.isFinite(discountAmountNum) && discountAmountNum > 0;
	const nowTs = Date.now();
	const startOk =
		!(product as any).discountStart ||
		new Date(String((product as any).discountStart)).getTime() <= nowTs;
	const endOk =
		!(product as any).discountEnd ||
		new Date(String((product as any).discountEnd)).getTime() >= nowTs;
	const discountActive = hasDiscount && startOk && endOk;
	const discountedPrice = discountActive
		? Math.max(0, price - discountAmountNum)
		: price;

	const aspectRatio = imgAspect ?? 16 / 9;

	return (
		<form
			action={`/osta/${product.id}`}
			method="get"
			className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-3xl lg:pl-12"
			tabIndex={0}
			aria-label={`Katso tuote: ${product.title}`}
		>
			<motion.button
				type="submit"
				className="relative w-full overflow-hidden rounded-2xl border border-[var(--color-border)]/30 shadow-xl transition-shadow hover:shadow-2xl hover:shadow-[var(--color-primary)]/20 cursor-pointer"
				initial={{ opacity: 0, scale: 0.98 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.4 }}
				whileHover={{ scale: 1.015 }}
				whileTap={{ scale: 0.98 }}
				style={{ aspectRatio }}
			>
				{discountActive && (
					<div className="absolute top-3 left-3 z-10">
						<span className="discount-badge badge-spotlight">
							{`-${discountAmountNum} €`}
						</span>
					</div>
				)}
				{/* Image fills container; aspect-ratio is controlled by style above */}
				{imageUrl ? (
					<Image
						src={imageUrl}
						alt={product.title ?? "Tuotekuva"}
						fill
						priority={current === 0}
						fetchPriority="high"
						sizes="(max-width: 1024px) 100vw, 640px"
						className="w-full h-full object-cover"
						onLoadingComplete={({ naturalWidth, naturalHeight }) => {
							if (naturalWidth > 0 && naturalHeight > 0)
								setImgAspect(naturalWidth / naturalHeight);
						}}
					/>
				) : (
					<div className="w-full h-full bg-gradient-to-br from-[var(--color-primary)]/15 to-[var(--color-tertiary)]/15" />
				)}

				{/* Overlay content */}
				<div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/50 via-black/10 to-transparent p-3 md:p-5">
					<div>
						<h3 className="line-clamp-2 text-base md:text-lg font-bold text-white">
							{product.title}
						</h3>
						<p className="mt-1 text-xs md:text-sm text-gray-200 line-clamp-2">
							{product.cpu} • {product.gpu}
						</p>
					</div>
					<div className="mt-3 flex items-center justify-between">
						{discountActive ? (
							<div className="flex items-baseline gap-2">
								<span className="text-xs md:text-sm line-through text-white/70">
									{price}€
								</span>
								<span className="text-xl md:text-2xl font-black text-white">
									{discountedPrice}€
								</span>
							</div>
						) : (
							<div className="text-xl md:text-2xl font-black text-white">
								{price}€
							</div>
						)}
						{hasMany && (
							<div className="flex justify-center gap-2">
								{items.map((it, i) => (
									<span
										key={it.id}
										className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "w-5 bg-white" : "w-2 bg-white/50"}`}
										aria-hidden
									/>
								))}
							</div>
						)}
					</div>
				</div>
			</motion.button>
		</form>
	);
};

// HOW: This component renders a card with an icon, title, and description to highlight a specific feature or value proposition.
// WHY: It breaks down complex information into easily digestible visual blocks, making it easier for users to understand the company's benefits.
const FeatureCard = ({
	icon,
	title,
	description,
	highlight,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
	highlight?: boolean;
}) => (
	<motion.div
		variants={itemVariants}
		initial="hidden"
		whileInView="visible"
		viewport={{ once: true, amount: 0.15 }}
		transition={{ duration: 0.35, ease: [0.25, 0.25, 0.25, 1] }}
		className={`relative group cursor-pointer transform-gpu ${highlight ? "md:scale-105" : ""}`}
		whileHover={{ scale: highlight ? 1.04 : 1.03 }}
	>
		<div
			className={cn(
				"relative backdrop-blur-xl border p-8 rounded-2xl text-center overflow-hidden",
				highlight
					? "bg-gradient-to-br from-[var(--color-surface-2)]/30 to-[var(--color-surface-3)]/30 border-[var(--color-primary)]/50 shadow-2xl shadow-[var(--color-primary)]/20"
					: "bg-[var(--color-surface-2)]/50 border-[var(--color-border)]/50",
			)}
		>
			{/* Animated background */}
			<div
				className={cn(
					"absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--color-primary)]/10 via-[var(--color-tertiary)]/5 to-transparent opacity-0 transition-opacity duration-200",
					"group-hover:opacity-100",
				)}
			></div>

			{/* Glow effect */}
			<div
				className={cn(
					"absolute inset-0 rounded-2xl blur-xl opacity-0 transition-opacity duration-200",
					highlight
						? "bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-tertiary)]/10"
						: "bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-secondary)]/10",
					"group-hover:opacity-100",
				)}
			></div>

			<div className="relative z-10">
				<div
					className={cn(
						"inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 transition-transform duration-200 transform-gpu",
						highlight
							? "bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-tertiary)] shadow-lg shadow-[var(--color-primary)]/25"
							: "bg-[var(--color-surface-3)]/50 group-hover:from-[var(--color-primary)] group-hover:to-[var(--color-secondary)]",
					)}
				>
					{icon}
				</div>
				<h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-3 group-hover:text-[var(--color-accent-light)] transition-colors">
					{title}
				</h3>
				<p className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors leading-relaxed">
					{description}
				</p>
			</div>
		</div>
	</motion.div>
);

// Use reusable ProductCard component for consistency and performance rating

// HOW: This component displays a single statistic with a label and an icon.
// WHY: It provides a quick, visually appealing way to present key metrics and data points to the user.
const StatCard = ({
	value,
	label,
	icon,
}: {
	value: string;
	label: string;
	icon: React.ReactNode;
}) => (
	<motion.div
		variants={itemVariants}
		initial="hidden"
		whileInView="visible"
		viewport={{ once: true, amount: 0.15 }}
		transition={{ duration: 0.35, ease: [0.25, 0.25, 0.25, 1] }}
		className="text-center p-6 rounded-xl bg-[var(--color-surface-2)]/30 backdrop-blur-sm border border-[var(--color-border)]/30 transform-gpu"
	>
		<div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-tertiary)]/20 mb-3">
			{icon}
		</div>
		<div className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">
			{value}
		</div>
		<div className="text-[var(--color-text-secondary)] text-sm">{label}</div>
	</motion.div>
);

// HOW: This component renders the main landing page of the application.
// WHY: It serves as the primary entry point for users, showcasing featured products and company values.
export default function HomePage() {
	// HOW: Get featured listings for hero section and most viewed listings for main section
	// WHY: Show popular items to increase engagement while keeping hero section for featured promotions
	const { data: featuredListings } =
		api.listings.getActiveCompanyListings.useQuery(
			{ limit: 6, featuredOnly: true },
			{
				// HOW: SWR-ish policy for hero listings to avoid stale data while keeping UI snappy.
				// WHY: Serve cached data immediately, then revalidate frequently so sold/new items reflect quickly.
				staleTime: 15_000, // treat data as fresh for 15s
				gcTime: 5 * 60_000, // keep in cache for 5 min
				refetchOnWindowFocus: true,
				refetchOnReconnect: true,
				refetchInterval: 60_000, // background revalidate every 60s
				refetchIntervalInBackground: true,
				placeholderData: (prev: ListingWithSeller[] | undefined) => prev,
			},
		);
	// Get most viewed listings for main section
	const { data: popularListings, isLoading: isPopularLoading } =
		api.listings.getActiveCompanyListings.useQuery(
			{ limit: 6, sortBy: "views", sortOrder: "desc" },
			{
				staleTime: 30_000, // treat data as fresh for 30s
				gcTime: 5 * 60_000, // keep in cache for 5 min
				refetchOnWindowFocus: true,
				refetchOnReconnect: true,
				refetchInterval: 60_000, // background revalidate every 60s
				refetchIntervalInBackground: true,
			},
		);

	// Cache on client for snappy loads; server caches in Redis.
	const { data: heroStats } = api.metrics.getHeroStats.useQuery(undefined, {
		staleTime: 30_000,
		refetchOnWindowFocus: true,
		refetchOnReconnect: true,
		refetchInterval: 120_000,
		refetchIntervalInBackground: true,
	});

	return (
		<div className="bg-[var(--color-surface-1)] text-[var(--color-text-primary)] min-h-screen py-6 lg:py-0">
			{/* Hero Section - Enhanced */}
			<motion.section
				className="relative min-h-[60vh] md:min-h-[85vh] flex items-center justify-center overflow-hidden py-8 lg:py-20"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.6 }}
			>
				{/* Dynamic Background */}
				<div className="absolute inset-0 overflow-hidden">
					<div className="absolute inset-0 bg-[var(--color-surface-1)]"></div>

					{/* Animated gradient orbs */}
					<motion.div
						className="hidden sm:block absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-[var(--color-primary)]/30 to-[var(--color-tertiary)]/30 rounded-full blur-3xl"
						animate={{
							scale: [1, 1.2, 1],
							rotate: [0, 180, 360],
						}}
						transition={{
							duration: 24,
							repeat: Infinity,
							ease: "linear",
						}}
					/>
					<motion.div
						className="hidden sm:block absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-[var(--color-tertiary)]/20 to-[var(--color-accent)]/20 rounded-full blur-3xl"
						animate={{
							scale: [1.2, 1, 1.2],
							rotate: [360, 180, 0],
						}}
						transition={{
							duration: 28,
							repeat: Infinity,
							ease: "linear",
						}}
					/>
					<motion.div
						className="hidden sm:block absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-[var(--color-quaternary)]/20 to-[var(--color-primary)]/20 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"
						animate={{
							scale: [1, 1.3, 1],
							opacity: [0.3, 0.6, 0.3],
						}}
						transition={{
							duration: 15,
							repeat: Infinity,
							ease: "easeInOut",
						}}
					/>
				</div>

				<div className="container mx-auto max-w-6xl px-6 relative z-10">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[60vh] md:min-h-[70vh]">
						<motion.div
							initial={{ y: 30, opacity: 0 }}
							whileInView={{ y: 0, opacity: 1 }}
							viewport={{ once: true, amount: 0.35 }}
							transition={{ duration: 0.5 }}
							className="text-center lg:text-left max-w-2xl mx-auto lg:mx-0"
						>
							<div className="inline-flex items-center px-3.5 py-2 rounded-full bg-gradient-to-r from-[var(--color-primary-dark)]/50 to-[var(--color-tertiary)]/50 border border-[var(--color-primary)]/30 mb-6">
								<Sparkles className="w-4 h-4 text-[var(--color-primary-light)] mr-2" />
								<span className="text-sm text-gray-100 font-medium">
									{heroStats
										? `${heroStats.activeCount} aktiivista konetta • keskihinta ${Number.isFinite(heroStats.avgPrice) ? Math.round(heroStats.avgPrice) : 0}€`
										: "Ladataan..."}
								</span>
							</div>

							<h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4">
								<span className="block text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-text-primary)] via-[var(--color-text-secondary)] to-[var(--color-text-primary)]">
									Pelikoneet
								</span>
								<span className="block text-gradient-primary">
									Uudella Tasolla
								</span>
							</h1>

							<p className="text-lg md:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-6 leading-relaxed">
								Hanki premium-tason gaming-PC puoleen hintaan tai myy omasi
								<span className="text-gradient-primary font-semibold">
									{" "}
									hetkessä
								</span>{" "}
								– 12 kuukauden takuulla ja ympäristöä säästäen.
							</p>
							<div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 sm:gap-6">
								<Button
									asChild
									size="lg"
									className="group relative bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-tertiary)] text-white font-bold text-lg px-10 py-6 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[var(--color-primary)]/25 border-0"
								>
									<Link href="/osta">
										<span className="relative z-10 flex items-center">
											Selaa koneita
											<ShoppingCart className="ml-3 w-5 h-5 group-hover:rotate-12 transition-transform" />
										</span>
										<div className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)]/20 to-[var(--color-tertiary)]/20 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity"></div>
									</Link>
								</Button>

								<Button
									asChild
									size="lg"
									variant="outline"
									className="group text-lg px-10 py-6 rounded-2xl border-2 border-[var(--color-border)] hover:border-[var(--color-primary)] bg-[var(--color-surface-2)]/50 backdrop-blur-sm hover:bg-[var(--color-primary)]/30 text-[var(--color-text-primary)] hover:text-[var(--color-primary-light)] transition-all duration-300 hover:scale-105 hover:shadow-xl"
								>
									<Link href="/myy">
										<span className="flex items-center">
											Myy koneesi – pyydä tarjous
										</span>
									</Link>
								</Button>
							</div>

							{/* Highlights */}
							<div className="mt-10 grid grid-cols-2 gap-4 max-w-xl mx-auto lg:mx-0">
								<StatCard
									value="12 kk"
									label="Takuu"
									icon={
										<ShieldCheck className="w-6 h-6 text-[var(--color-tertiary)]" />
									}
								/>
								<StatCard
									value="Ilmainen"
									label="Toimitus"
									icon={
										<Truck className="w-6 h-6 text-[var(--color-primary)]" />
									}
								/>
							</div>
						</motion.div>

						{/* Right: featured listing / carousel */}
						<div className="order-last lg:order-last mt-6 lg:mt-0 max-w-[720px] sm:max-w-[600px] w-full mx-auto lg:pl-10">
							<HeroFeaturedCarousel
								items={(featuredListings ?? []).slice(0, 5)}
							/>
						</div>
					</div>
				</div>
			</motion.section>

			{/* Featured Products Section - Enhanced */}
			<section className="py-section relative">
				<div className="absolute inset-0 bg-gradient-to-b from-[var(--color-surface-1)] to-[var(--color-surface-2)]"></div>
				<div className="container mx-auto px-container relative">
					<motion.div
						initial={{ y: 30, opacity: 0 }}
						whileInView={{ y: 0, opacity: 1 }}
						viewport={{ once: true, amount: 0.3 }}
						transition={{ duration: 0.8 }}
						className="text-center mb-2xl pb-10"
					>
						<div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-[var(--color-secondary-dark)]/50 to-[var(--color-primary-dark)]/50 border border-[var(--color-secondary)]/30 mb-6">
							<TrendingUp className="w-4 h-4 text-[var(--color-secondary-light)] mr-2" />
							<span className="text-sm text-[var(--color-secondary-light)] font-medium">
								Suosituimmat pelikoneet
							</span>
						</div>

						<h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-center">
							<span className="block sm:inline text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-text-primary)] to-[var(--color-text-secondary)]">
								Peli-Koneet
							</span>
							<span className="block sm:inline text-gradient-primary sm:pl-2">
								valmiina toimintaan
							</span>
						</h2>

						<p className="text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto">
							Katsotuimmat ja suosituimmat pelikoneet – asiantuntijoiden
							kunnostamat, testatut ja optimoidut. Pelaaminen voi alkaa heti
							laatikon avaamisen jälkeen.
						</p>
					</motion.div>

					{isPopularLoading ? (
						<div className="product-list grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
							{[...Array(3)].map((_, i) => (
								<div
									key={i}
									className="bg-[var(--color-surface-2)]/50 rounded-2xl p-6 h-64 animate-pulse"
								>
									<div className="h-4 bg-[var(--color-surface-3)] rounded mb-4"></div>
									<div className="h-3 bg-[var(--color-surface-3)] rounded mb-2"></div>
									<div className="h-3 bg-[var(--color-surface-3)] rounded mb-6"></div>
									<div className="h-8 bg-[var(--color-surface-3)] rounded w-24 ml-auto"></div>
								</div>
							))}
						</div>
					) : (
						<>
							{/* Mobile list view for featured */}
							<div className="sm:hidden space-y-3">
								{popularListings?.map(
									(listing: ListingWithSeller, index: number) => (
										<ListingCard
											key={listing.id}
											listing={listing}
											onPurchaseClick={() => {
												/* noop on homepage */
											}}
											variant="list"
											eager={index < 3}
										/>
									),
								)}
							</div>

							{/* Tablet/Desktop grid */}
							<motion.div
								className="hidden sm:grid product-list grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6 mb-2xl"
								variants={containerVariants}
								initial="hidden"
								whileInView="visible"
								viewport={{ once: true, amount: 0.2 }}
							>
								{popularListings?.map(
									(listing: ListingWithSeller, index: number) => (
										<motion.div
											key={listing.id}
											variants={itemVariants}
											initial="hidden"
											whileInView="visible"
											viewport={{ once: true, amount: 0.2 }}
										>
											<ListingCard
												listing={listing}
												onPurchaseClick={() => {
													/* noop on homepage */
												}}
												eager={index < 4}
											/>
										</motion.div>
									),
								)}
							</motion.div>
						</>
					)}

					<div className="text-center pt-10">
						<Button
							asChild
							size="lg"
							className="group bg-gradient-to-r from-[var(--color-surface-3)] to-[var(--color-surface-4)] hover:from-[var(--color-primary-dark)] hover:to-[var(--color-tertiary)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:border-[var(--color-primary)] px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105"
						>
							<Link href="/osta">
								Näytä kaikki koneet
								<ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
							</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* Why Choose Us Section - Enhanced */}
			<section className="py-section relative">
				<div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary-dark)]/20 via-[var(--color-surface-1)] to-[var(--color-tertiary)]/20"></div>
				<div className="container mx-auto px-container relative">
					<motion.div
						initial={{ y: 30, opacity: 0 }}
						whileInView={{ y: 0, opacity: 1 }}
						viewport={{ once: true, amount: 0.3 }}
						transition={{ duration: 0.8 }}
						className="text-center mb-2xl"
					>
						<h2 className="text-4xl md:text-5xl font-bold mb-6">
							<span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-text-primary)] to-[var(--color-text-secondary)]">
								Miksi
							</span>
							<span className="text-gradient-primary pl-2 md:pl-3">
								Repur.fi?
							</span>
						</h2>

						<p className="text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto">
							Kunnostamme ja myymme premium-pelitietokoneita Suomessa. Tarjoamme
							12 kuukauden takuun, reilun hinnoittelun ja selkeät speksit –
							ilman piilokuluja.
						</p>
					</motion.div>

					<motion.div
						className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3  gap-4 sm:gap-5 md:gap-6 pt-10"
						variants={containerVariants}
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true, amount: 0.2 }}
					>
						<FeatureCard
							icon={
								<ShieldCheck className="w-8 h-8 text-[var(--color-surface-inverse)] z-50 relative " />
							}
							title="12 kuukauden takuu"
							description="Jokainen kone sisältää kattavan takuun ja nopean asiakastuen. Mielenrauhaasi ei myydä erikseen."
							highlight={true}
						/>
						<FeatureCard
							icon={
								<Zap className="w-8 h-8 text-[var(--color-surface-inverse)]" />
							}
							title="Testattua Tehoa"
							description="Suorituskyky on varmistettu raskailla pelimitouksilla. Saat juuri sen suorituskyvyn, mitä lupaamme."
						/>
						<FeatureCard
							icon={
								<Recycle className="w-8 h-8 text-[var(--color-surface-inverse)]" />
							}
							title="Kestävä Valinta"
							description="Vähennä elektroniikkajätettä jopa 80%. Pelaaminen ei ole koskaan ollut näin ympäristöystävällistä."
						/>
						<FeatureCard
							icon={
								<Euro className="w-8 h-8 text-[var(--color-surface-inverse)]" />
							}
							title="Reilut Hinnat"
							description="Maksat vain suorituskyvystä, ei brändistä. Säästä jopa 50% uuden hinnasta menettämättä laatua."
						/>
						<FeatureCard
							icon={
								<Wrench className="w-8 h-8 text-[var(--color-surface-inverse)]" />
							}
							title="Huolellinen kunnostus"
							description="Jokainen osa tarkistetaan, tarvittaessa päivitetään ja optimoidaan luotettavaa käyttöä varten."
						/>
						<FeatureCard
							icon={
								<Truck className="w-8 h-8 text-[var(--color-surface-inverse)]" />
							}
							title="Ilmainen toimitus"
							description="Nopea ja turvallinen toimitus Suomessa – ilman lisäkuluja."
						/>
					</motion.div>
				</div>
			</section>

			{/* Sell Your PC Section - Enhanced CTA */}
			<section className="py-section relative overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-br from-purple-950 to-black"></div>

				{/* Animated background elements */}
				<motion.div
					className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-[var(--color-secondary)]/20 to-[var(--color-primary)]/20 rounded-full blur-3xl"
					animate={{
						scale: [1, 1.2, 1],
						opacity: [0.3, 0.6, 0.3],
					}}
					transition={{
						duration: 12,
						repeat: Infinity,
						ease: "easeInOut",
					}}
				/>

				<div className="container mx-auto px-container relative">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-xl items-center">
						<motion.div
							initial={{ x: -50, opacity: 0 }}
							whileInView={{ x: 0, opacity: 1 }}
							viewport={{ once: true, amount: 0.5 }}
							transition={{ duration: 0.8 }}
						>
							<div className="inline-flex items-center px-4 py-2 rounded-full border border-[var(--color-secondary)]/30 mb-8">
								<Euro className="w-4 h-4 text-[var(--color-secondary-light)] mr-2" />
								<span className="text-sm text-[var(--color-secondary-light)] font-medium">
									Käteistä hetkessä
								</span>
							</div>

							<h2 className="text-4xl md:text-5xl font-bold mb-6">
								<span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-text-primary)] to-[var(--color-text-secondary)]">
									Muuta Vanha Koneesi
								</span>
								<span className="text-gradient-secondary pl-2 md:pl-3">
									käteiseksi
								</span>
							</h2>

							<p className="text-xl text-[var(--color-text-secondary)] mb-8 leading-relaxed">
								Miksi antaa vanhan pelikoneen kerätä pölyä? Saat meiltä reilun
								alustavan arvion nopeasti ja vaivattomasti – prosessi on
								suunniteltu sinua varten.
							</p>

							<div className="space-y-4 mb-2xl pb-10">
								{[
									"Alustava hinta-arvio verkossa",
									"Maksuton nouto tai postitus sovittaessa",
									"Nopea käsittely ja selkeä lopullinen tarjous",
									"Rahat tilille tarjouksen hyväksynnän jälkeen",
								].map((item, i) => (
									<motion.div
										key={i}
										className="flex items-start space-x-3"
										initial={{ x: -20, opacity: 0 }}
										whileInView={{ x: 0, opacity: 1 }}
										viewport={{ once: true }}
										transition={{ delay: i * 0.1 }}
									>
										<CheckCircle2 className="w-6 h-6 text-[var(--color-success)] mt-0.5 flex-shrink-0" />
										<span className="text-[var(--color-text-secondary)]">
											{item}
										</span>
									</motion.div>
								))}
							</div>

							<div className="flex flex-col sm:flex-row gap-4">
								<Button
									asChild
									size="lg"
									className="group relative bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-primary)] hover:from-[var(--color-secondary-dark)] hover:to-[var(--color-primary-dark)] text-white font-bold text-lg px-8 py-6 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[var(--color-secondary)]/25"
								>
									<Link href="/myy">
										<span className="flex items-center">
											Aloita myynti nyt
											<ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
										</span>
									</Link>
								</Button>

								<Button
									asChild
									size="lg"
									variant="outline"
									className="group text-lg px-10 py-6 rounded-2xl border-2 border-[var(--color-border)] hover:border-[var(--color-secondary)] bg-[var(--color-surface-2)]/50 backdrop-blur-sm hover:bg-[var(--color-secondary)]/30 text-[var(--color-text-primary)] hover:text-[var(--color-secondary-light)] transition-all duration-300 hover:scale-105 hover:shadow-xl"
								>
									<Link href="/osta">Katso esimerkkikoneita</Link>
								</Button>
							</div>
						</motion.div>
					</div>
				</div>
			</section>

			{/* CTA Section - Laatu & lupaus (ei keksittyjä tilastoja) */}
			<section className="py-section relative bg-gradient-to-br from-[var(--color-surface-1)] to-[var(--color-surface-2)]">
				<div className="container mx-auto px-container relative z-10 text-center">
					<motion.div
						initial={{ opacity: 0, y: 40 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, amount: 0.6 }}
						transition={{ duration: 0.8 }}
						className="w-full max-w-5xl mx-auto"
					>
						<div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-[var(--color-primary)]/20 to-[var(--color-accent)]/20 border border-[var(--color-primary)]/30 mb-8">
							<Award className="w-4 h-4 text-[var(--color-primary)] mr-2" />
							<span className="text-sm text-[var(--color-primary)] font-medium">
								Sitoutuminen Laatuun
							</span>
						</div>

						<h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gradient-primary mb-6 leading-tight">
							Laatu, läpinäkyvyys ja takuu
						</h2>
						<p className="text-xl md:text-2xl text-[var(--color-text-secondary)] mb-10 max-w-3xl mx-auto leading-relaxed">
							Jokainen myymämme tietokone edustaa sitoutumistamme laatuun,
							luotettavuuteen ja kestävään kehitykseen. Me emme myy vain
							tietokoneita – me myymme mielenrauhaa.
						</p>

						<div className="flex flex-col sm:flex-row justify-center gap-4">
							<Button
								asChild
								size="lg"
								className="group relative bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-tertiary)] hover:from-[var(--color-primary-dark)] hover:to-[var(--color-tertiary)]/90 text-white font-bold text-lg px-10 py-6 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[var(--color-primary)]/25 border-0"
							>
								<Link href="/osta">
									<span className="relative z-10 flex items-center">
										Selaa koneita
										<ShoppingCart className="ml-3 w-5 h-5 group-hover:rotate-12 transition-transform" />
									</span>
									<div className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)]/20 to-[var(--color-tertiary)]/20 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity"></div>
								</Link>
							</Button>

							<Button
								asChild
								size="lg"
								variant="outline"
								className="group text-lg px-10 py-6 rounded-2xl border-2 border-[var(--color-border)] hover:border-[var(--color-secondary)] bg-[var(--color-surface-2)]/50 backdrop-blur-sm hover:bg-[var(--color-secondary)]/30 text-[var(--color-text-primary)] hover:text-[var(--color-secondary-light)] transition-all duration-300 hover:scale-105 hover:shadow-xl"
							>
								<Link href="/meista">Lue meistä lisää</Link>
							</Button>
						</div>
					</motion.div>
				</div>
			</section>
		</div>
	);
}
