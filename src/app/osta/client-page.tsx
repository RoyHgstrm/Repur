"use client";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import type { RouterOutputs } from "~/trpc/react";
import { Search, Zap, Shield, Truck, Filter, SortAsc } from "lucide-react";
import { ProductCard } from "~/components/features/ProductCard";
import { api } from "~/trpc/react";

// HOW: This component renders the main product listing page, allowing users to browse, search, filter, and sort computer listings.
// WHY: It provides the core shopping experience for users to find and select products that meet their specific needs and budget.
interface OstaPageClientProps {
	initialListings: RouterOutputs["listings"]["searchCompanyListings"];
	initialSearchTerm?: string;
	initialSortBy?: "price-low" | "price-high" | "newest" | "rating";
	initialFilterCondition?: string;
	initialPerfTier?: "all" | "Huippusuoritus" | "Erinomainen" | "Hyvä" | "Perus";
	initialGpuTier?: | "all" | "RTX50" | "RTX40" | "RTX30" | "RTX20" | "GTX" | "RX9000" | "RX8000" | "RX7000" | "RX6000" | "RX5000" | "ARC";
	initialCpuTier?: | "all" | "IntelCore3" | "IntelCore5" | "IntelCore7" | "IntelCore9" | "IntelUltra5" | "IntelUltra7" | "IntelUltra9" | "Ryzen3" | "Ryzen5" | "Ryzen7" | "Ryzen9";
	initialPriceMin?: string;
	initialPriceMax?: string;
	initialFeaturedOnly?: boolean;
}

export default function OstaPageClient({
	initialListings,
	initialSearchTerm,
	initialSortBy,
	initialFilterCondition,
	initialPerfTier,
	initialGpuTier,
	initialCpuTier,
	initialPriceMin,
	initialPriceMax,
	initialFeaturedOnly,
}: OstaPageClientProps) {
	const [searchTerm, setSearchTerm] = useState(initialSearchTerm ?? "");
	const [sortBy, setSortBy] = useState<
		"price-low" | "price-high" | "newest" | "rating"
	>(initialSortBy ?? "newest");
	const [filterCondition, setFilterCondition] = useState<string>(
		initialFilterCondition ?? "all",
	);
	const [perfTier, setPerfTier] = useState<
		"all" | "Huippusuoritus" | "Erinomainen" | "Hyvä" | "Perus"
	>(initialPerfTier ?? "all");
	const [gpuTier, setGpuTier] = useState<
		| "all"
		| "RTX50"
		| "RTX40"
		| "RTX30"
		| "RTX20"
		| "GTX"
		| "RX9000"
		| "RX8000"
		| "RX7000"
		| "RX6000"
		| "RX5000"
		| "ARC"
	>(initialGpuTier ?? "all");
	const [cpuTier, setCpuTier] = useState<
		| "all"
		| "IntelCore3"
		| "IntelCore5"
		| "IntelCore7"
		| "IntelCore9"
		| "IntelUltra5"
		| "IntelUltra7"
		| "IntelUltra9"
		| "Ryzen3"
		| "Ryzen5"
		| "Ryzen7"
		| "Ryzen9"
	>(initialCpuTier ?? "all");
	const [priceMin, setPriceMin] = useState<string>(initialPriceMin ?? "");
	const [priceMax, setPriceMax] = useState<string>(initialPriceMax ?? "");
	const [featuredOnly, setFeaturedOnly] = useState<boolean>(
		initialFeaturedOnly ?? false,
	);
	const [mobileFiltersOpen, setMobileFiltersOpen] = useState<boolean>(false);

	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
		}, 500);

		return () => {
			clearTimeout(handler);
		};
	}, [searchTerm]);

	const { data: dynamicListings, isLoading } =
		api.listings.searchCompanyListings.useQuery(
			{
				searchTerm: debouncedSearchTerm,
				sortBy,
				filterCondition,
				perfTier,
				gpuTier,
				cpuTier,
				priceMin: priceMin ? Number(priceMin) : undefined,
				priceMax: priceMax ? Number(priceMax) : undefined,
				featuredOnly,
			},
			{
				staleTime: 5 * 60_000,
				gcTime: 30 * 60_000,
				refetchOnWindowFocus: false,
				refetchOnReconnect: false,
			},
		);

	// Combine initial data with dynamic data for the current view
	const currentListings = dynamicListings ?? initialListings;

	type ActiveListing =
		RouterOutputs["listings"]["searchCompanyListings"][number];

	return (
		<div className="min-h-screen bg-gradient-to-br from-[var(--color-surface-1)] via-[var(--color-surface-2)] to-[var(--color-surface-1)]">
			{/* Hero Section */}
			<div className="relative overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)]/110 via-[var(--color-secondary)]/110 to-[var(--color-accent)]/110" />
				<div className="container-responsive py-section relative">
					<div className="text-center space-y-6 max-w-4xl mx-auto">
						<div className="inline-flex items-center gap-2 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] p-1 rounded-full">
							<span className="bg-white text-[var(--color-primary)] px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
								<Zap className="w-4 h-4" />
								Premium Pelitietokoneet
							</span>
						</div>

						<h1 className="text-gradient-primary text-4xl-fluid md:text-5xl-fluid font-black leading-tight">
							Osta Kunnostettu
							<br />
							<span className="text-gradient-accent">Pelitietokone</span>
						</h1>

						<p className="text-secondary text-lg-fluid max-w-2xl mx-auto">
							Löydä täydellinen pelitietokone laajasta valikoimastamme. Kaikki
							koneet on huolellisesti kunnostettu ja testattu.
						</p>

						{/* Trust Indicators */}
						<div className="flex flex-wrap justify-center gap-6 mt-8">
							<div className="flex items-center gap-2 text-accent-secondary">
								<Shield className="w-5 h-5" />
								<span className="text-sm font-medium">12kk Takuu</span>
							</div>
							<div className="flex items-center gap-2 text-accent-primary">
								<Truck className="w-5 h-5" />
								<span className="text-sm font-medium">Ilmainen Toimitus</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="w-full py-8 mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
				{/* Mobile: Filters dropdown trigger */}
				<div className="sm:hidden mb-4 flex items-center justify-between">
					<Button
						variant="outline"
						className="h-10"
						onClick={() => setMobileFiltersOpen(true)}
					>
						Suodattimet
					</Button>
					<span className="text-secondary text-sm">
						{isLoading ? "Ladataan..." : `${currentListings?.length ?? 0} kpl`}
					</span>
				</div>

				{/* Mobile: Filters dialog */}
				<Dialog open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
					<DialogContent className="sm:max-w-lg">
						<DialogHeader>
							<DialogTitle>Suodata</DialogTitle>
						</DialogHeader>
						<div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
							{/* Search */}
							<div className="space-y-2">
								<Label className="text-secondary font-medium">Haku</Label>
								<div className="relative">
									<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary" />
									<Input
										placeholder="Prosessori, näytönohjain, malli..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										className="pl-10 h-10 bg-surface-3 border-[var(--color-border-light)] text-primary placeholder:text-tertiary"
									/>
								</div>
							</div>

							{/* Condition */}
							<div className="space-y-2">
								<Label className="text-secondary font-medium">Kunto</Label>
								<Select
									value={filterCondition}
									onValueChange={setFilterCondition}
								>
									<SelectTrigger className="h-10 bg-surface-3 border-[var(--color-border-light)] text-primary">
										<SelectValue placeholder="Kaikki kunnot" />
									</SelectTrigger>
									<SelectContent className="bg-surface-2 border-[var(--color-border-light)]">
										<SelectItem value="all">Kaikki kunnot</SelectItem>
										<SelectItem value="Uusi">Uusi</SelectItem>
										<SelectItem value="Kuin uusi">Kuin uusi</SelectItem>
										<SelectItem value="Hyvä">Hyvä</SelectItem>
										<SelectItem value="Tyydyttävä">Tyydyttävä</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Sort */}
							<div className="space-y-2">
								<Label className="text-secondary font-medium">Järjestä</Label>
								<Select
									value={sortBy}
									onValueChange={(value: any) => setSortBy(value)}
								>
									<SelectTrigger className="h-10 bg-surface-3 border-[var(--color-border-light)] text-primary">
										<SelectValue />
									</SelectTrigger>
									<SelectContent className="bg-surface-2 border-[var(--color-border-light)]">
										<SelectItem value="newest">Uusimmat ensin</SelectItem>
										<SelectItem value="price-low">Halvin ensin</SelectItem>
										<SelectItem value="price-high">Kallein ensin</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Featured + Price */}
							<div className="space-y-2">
								<Label className="text-secondary font-medium">
									Nostot & Hinta
								</Label>
								<div className="grid grid-cols-3 gap-2">
									<button
										type="button"
										onClick={() => setFeaturedOnly((v) => !v)}
										className={`h-10 rounded-md border px-3 text-sm ${featuredOnly ? "border-[var(--color-primary)] text-[var(--color-primary)]" : "border-[var(--color-border-light)] text-primary"} bg-surface-3 transition-colors`}
										aria-pressed={featuredOnly}
									>
										{featuredOnly ? "Vain nostetut" : "Kaikki"}
									</button>
									<Input
										type="number"
										placeholder="Min €"
										value={priceMin}
										onChange={(e) => setPriceMin(e.target.value)}
										className="h-10 bg-surface-3 border-[var(--color-border-light)] text-primary placeholder:text-tertiary"
									/>
									<Input
										type="number"
										placeholder="Max €"
										value={priceMax}
										onChange={(e) => setPriceMax(e.target.value)}
										className="h-10 bg-surface-3 border-[var(--color-border-light)] text-primary placeholder:text-tertiary"
									/>
								</div>
							</div>

							{/* Advanced */}
							<div className="space-y-2">
								<Label className="text-secondary font-medium">
									Suorituskyky
								</Label>
								<Select
									value={perfTier}
									onValueChange={(v: any) => setPerfTier(v)}
								>
									<SelectTrigger className="h-10 bg-surface-3 border-[var(--color-border-light)] text-primary">
										<SelectValue placeholder="Kaikki tasot" />
									</SelectTrigger>
									<SelectContent className="bg-surface-2 border-[var(--color-border-light)]">
										<SelectItem value="all">Kaikki tasot</SelectItem>
										<SelectItem value="Huippusuoritus">
											Huippusuoritus
										</SelectItem>
										<SelectItem value="Erinomainen">Erinomainen</SelectItem>
										<SelectItem value="Hyvä">Hyvä</SelectItem>
										<SelectItem value="Perus">Perus</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label className="text-secondary font-medium">GPU-sarja</Label>
								<Select
									value={gpuTier}
									onValueChange={(v: any) => setGpuTier(v)}
								>
									<SelectTrigger className="h-10 bg-surface-3 border-[var(--color-border-light)] text-primary">
										<SelectValue placeholder="Kaikki" />
									</SelectTrigger>
									<SelectContent className="bg-surface-2 border-[var(--color-border-light)] max-h-64 overflow-auto">
										<SelectItem value="all">Kaikki</SelectItem>
										<SelectItem value="RTX50">NVIDIA RTX 50</SelectItem>
										<SelectItem value="RTX40">NVIDIA RTX 40</SelectItem>
										<SelectItem value="RTX30">NVIDIA RTX 30</SelectItem>
										<SelectItem value="RTX20">NVIDIA RTX 20</SelectItem>
										<SelectItem value="GTX">NVIDIA GTX</SelectItem>
										<SelectItem value="RX9000">AMD RX 9000</SelectItem>
										<SelectItem value="RX8000">AMD RX 8000</SelectItem>
										<SelectItem value="RX7000">AMD RX 7000</SelectItem>
										<SelectItem value="RX6000">AMD RX 6000</SelectItem>
										<SelectItem value="RX5000">AMD RX 5000</SelectItem>
										<SelectItem value="ARC">Intel Arc</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label className="text-secondary font-medium">CPU-sarja</Label>
								<Select
									value={cpuTier}
									onValueChange={(v: any) => setCpuTier(v)}
								>
									<SelectTrigger className="h-10 bg-surface-3 border-[var(--color-border-light)] text-primary">
										<SelectValue placeholder="Kaikki" />
									</SelectTrigger>
									<SelectContent className="bg-surface-2 border-[var(--color-border-light)]">
										<SelectItem value="all">Kaikki</SelectItem>
										<SelectItem value="IntelCore9">Intel Core i9</SelectItem>
										<SelectItem value="IntelCore7">Intel Core i7</SelectItem>
										<SelectItem value="IntelCore5">Intel Core i5</SelectItem>
										<SelectItem value="IntelCore3">Intel Core i3</SelectItem>
										<SelectItem value="IntelUltra9">
											Intel Core Ultra 9
										</SelectItem>
										<SelectItem value="IntelUltra7">
											Intel Core Ultra 7
										</SelectItem>
										<SelectItem value="IntelUltra5">
											Intel Core Ultra 5
										</SelectItem>
										<SelectItem value="Ryzen9">AMD Ryzen 9</SelectItem>
										<SelectItem value="Ryzen7">AMD Ryzen 7</SelectItem>
										<SelectItem value="Ryzen5">AMD Ryzen 5</SelectItem>
										<SelectItem value="Ryzen3">AMD Ryzen 3</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="flex gap-2 pt-2">
								<Button
									variant="outline"
									className="flex-1"
									onClick={() => {
										setFilterCondition("all");
										setPerfTier("all");
										setGpuTier("all");
										setCpuTier("all");
										setPriceMin("");
										setPriceMax("");
										setFeaturedOnly(false);
										setSearchTerm("");
									}}
								>
									Tyhjennä
								</Button>
								<Button
									className="flex-1"
									onClick={() => setMobileFiltersOpen(false)}
								>
									Valmis
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>

				{/* Desktop: Search and Filter Section */}
				<div className="hidden sm:block card-responsive mb-8 p-6">
					<div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
						{/* Search */}
						<div className="space-y-2">
							<Label className="text-secondary font-medium">
								Etsi tietokonetta
							</Label>
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-tertiary" />
								<Input
									placeholder="Prosessori, näytönohjain, malli..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-10 h-10 sm:h-12 bg-surface-3 border-[var(--color-border-light)] text-primary placeholder:text-tertiary focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all"
								/>
							</div>
						</div>

						{/* Condition */}
						<div className="space-y-2">
							<Label className="text-secondary font-medium">Kunto</Label>
							<Select
								value={filterCondition}
								onValueChange={setFilterCondition}
							>
								<SelectTrigger className="h-10 sm:h-12 bg-surface-3 border-[var(--color-border-light)] text-primary">
									<div className="flex items-center gap-2">
										<Filter className="w-4 h-4" />
										<SelectValue placeholder="Kaikki kunnot" />
									</div>
								</SelectTrigger>
								<SelectContent className="bg-surface-2 border-[var(--color-border-light)]">
									<SelectItem value="all">Kaikki kunnot</SelectItem>
									<SelectItem value="Uusi">Uusi</SelectItem>
									<SelectItem value="Kuin uusi">Kuin uusi</SelectItem>
									<SelectItem value="Hyvä">Hyvä</SelectItem>
									<SelectItem value="Tyydyttävä">Tyydyttävä</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Sort */}
						<div className="space-y-2">
							<Label className="text-secondary font-medium">Järjestä</Label>
							<Select
								value={sortBy}
								onValueChange={(value: any) => setSortBy(value)}
							>
								<SelectTrigger className="h-10 sm:h-12 bg-surface-3 border-[var(--color-border-light)] text-primary">
									<div className="flex items-center gap-2">
										<SortAsc className="w-4 h-4" />
										<SelectValue />
									</div>
								</SelectTrigger>
								<SelectContent className="bg-surface-2 border-[var(--color-border-light)]">
									<SelectItem value="newest">Uusimmat ensin</SelectItem>
									<SelectItem value="price-low">Halvin ensin</SelectItem>
									<SelectItem value="price-high">Kallein ensin</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Featured + Price */}
						<div className="space-y-2">
							<Label className="text-secondary font-medium">
								Nostot & Hinta
							</Label>
							<div className="grid grid-cols-3 gap-2">
								<button
									type="button"
									onClick={() => setFeaturedOnly((v) => !v)}
									className={`h-10 sm:h-12 rounded-md border px-3 text-sm lg:text-xs ${featuredOnly ? "border-[var(--color-primary)] text-[var(--color-primary)]" : "border-[var(--color-border-light)] text-primary"} bg-surface-3 transition-colors`}
									aria-pressed={featuredOnly}
								>
									{featuredOnly ? "Vain nostetut" : "Kaikki listaukset"}
								</button>
								<Input
									type="number"
									placeholder="Min €"
									value={priceMin}
									onChange={(e) => setPriceMin(e.target.value)}
									className="h-10 sm:h-12 bg-surface-3 border-[var(--color-border-light)] text-primary placeholder:text-tertiary"
								/>
								<Input
									type="number"
									placeholder="Max €"
									value={priceMax}
									onChange={(e) => setPriceMax(e.target.value)}
									className="h-10 sm:h-12 bg-surface-3 border-[var(--color-border-light)] text-primary placeholder:text-tertiary"
								/>
							</div>
						</div>
					</div>

					{/* Advanced filters row */}
					<div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
						<div className="space-y-2">
							<Label className="text-secondary font-medium">Suorituskyky</Label>
							<Select
								value={perfTier}
								onValueChange={(v: any) => setPerfTier(v)}
							>
								<SelectTrigger className="h-10 sm:h-12 bg-surface-3 border-[var(--color-border-light)] text-primary">
									<SelectValue placeholder="Kaikki tasot" />
								</SelectTrigger>
								<SelectContent className="bg-surface-2 border-[var(--color-border-light)]">
									<SelectItem value="all">Kaikki tasot</SelectItem>
									<SelectItem value="Huippusuoritus">Huippusuoritus</SelectItem>
									<SelectItem value="Erinomainen">Erinomainen</SelectItem>
									<SelectItem value="Hyvä">Hyvä</SelectItem>
									<SelectItem value="Perus">Perus</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label className="text-secondary font-medium">GPU-sarja</Label>
							<Select value={gpuTier} onValueChange={(v: any) => setGpuTier(v)}>
								<SelectTrigger className="h-10 sm:h-12 bg-surface-3 border-[var(--color-border-light)] text-primary">
									<SelectValue placeholder="Kaikki" />
								</SelectTrigger>
								<SelectContent className="bg-surface-2 border-[var(--color-border-light)]">
									<SelectItem value="all">Kaikki</SelectItem>
									<SelectItem value="RTX50">NVIDIA RTX 50</SelectItem>
									<SelectItem value="RTX40">NVIDIA RTX 40</SelectItem>
									<SelectItem value="RTX30">NVIDIA RTX 30</SelectItem>
									<SelectItem value="RTX20">NVIDIA RTX 20</SelectItem>
									<SelectItem value="GTX">NVIDIA GTX</SelectItem>

									<SelectItem value="RX9000">AMD RX 9000</SelectItem>
									<SelectItem value="RX8000">AMD RX 8000</SelectItem>
									<SelectItem value="RX7000">AMD RX 7000</SelectItem>
									<SelectItem value="RX6000">AMD RX 6000</SelectItem>
									<SelectItem value="RX5000">AMD RX 5000</SelectItem>
									<SelectItem value="ARC">Intel Arc</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label className="text-secondary font-medium">CPU-sarja</Label>
							<Select value={cpuTier} onValueChange={(v: any) => setCpuTier(v)}>
								<SelectTrigger className="h-10 sm:h-12 bg-surface-3 border-[var(--color-border-light)] text-primary">
									<SelectValue placeholder="Kaikki" />
								</SelectTrigger>
								<SelectContent className="bg-surface-2 border-[var(--color-border-light)]">
									<SelectItem value="all">Kaikki</SelectItem>
									<SelectItem value="IntelCore9">Intel Core i9</SelectItem>
									<SelectItem value="IntelCore7">Intel Core i7</SelectItem>
									<SelectItem value="IntelCore5">Intel Core i5</SelectItem>
									<SelectItem value="IntelCore3">Intel Core i3</SelectItem>
									<SelectItem value="IntelUltra9">
										Intel Core Ultra 9
									</SelectItem>
									<SelectItem value="IntelUltra7">
										Intel Core Ultra 7
									</SelectItem>
									<SelectItem value="IntelUltra5">
										Intel Core Ultra 5
									</SelectItem>
									<SelectItem value="Ryzen9">AMD Ryzen 9</SelectItem>
									<SelectItem value="Ryzen7">AMD Ryzen 7</SelectItem>
									<SelectItem value="Ryzen5">AMD Ryzen 5</SelectItem>
									<SelectItem value="Ryzen3">AMD Ryzen 3</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Results Count */}
					<div className="mt-4 pt-4 border-t border-[var(--color-border)]">
						<p className="text-secondary text-sm">
							{isLoading
								? "Ladataan..."
								: `${currentListings?.length ?? 0} kpl`}
						</p>
					</div>
				</div>

				{/* Listings - Mobile list view and desktop grid */}
				{isLoading ? (
					<div className="flex flex-col items-center justify-center py-16 space-y-4">
						<div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-primary)] border-t-transparent"></div>
						<p className="text-secondary text-lg-fluid">
							Ladataan huippukoneita...
						</p>
					</div>
				) : currentListings?.length === 0 ? (
					<div className="text-center py-16 space-y-4">
						<div className="text-6xl">🔍</div>
						<h3 className="text-2xl-fluid font-bold text-primary">
							Ei hakutuloksia
						</h3>
						<p className="text-secondary text-lg-fluid max-w-md mx-auto">
							Kokeile eri hakusanoja tai muuta suodattimia löytääksesi
							täydellisen pelitietokoneen.
						</p>
					</div>
				) : (
					<>
						{/* Mobile list view */}
						<div className="sm:hidden space-y-3">
							{currentListings?.map(
								(listing: ActiveListing, index: number) => (
									<ProductCard
										key={listing.id ?? ""}
										listing={listing}
										onPurchaseClick={() => {
											// setSelectedListing(listing); // This line was removed as per the new_code
											// setPurchaseDetails({ // This line was removed as per the new_code
											//   paymentMethod: '', // This line was removed as per the new_code
											//   shippingAddress: '', // This line was removed as per the new_code
											// }); // This line was removed as per the new_code
											// purchaseMutation.mutate({ // This line was removed as per the new_code
											//   listingId: listing.id, // This line was removed as per the new_code
											//   paymentMethod: purchaseDetails?.paymentMethod, // This line was removed as per the new_code
											//   shippingAddress: purchaseDetails?.shippingAddress, // This line was removed as per the new_code
											// }); // This line was removed as per the new_code
										}}
										variant="list"
										eager={index < 3}
									/>
								),
							)}
						</div>

						{/* Tablet/Desktop grid */}
						<div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
							{currentListings?.map(
								(listing: ActiveListing, index: number) => (
									<ProductCard
										key={listing.id ?? ""}
										listing={listing}
										onPurchaseClick={() => {
											// setSelectedListing(listing); // This line was removed as per the new_code
											// setPurchaseDetails({ // This line was removed as per the new_code
											//   paymentMethod: '', // This line was removed as per the new_code
											//   shippingAddress: '', // This line was removed as per the new_code
											// }); // This line was removed as per the new_code
											// purchaseMutation.mutate({ // This line was removed as per the new_code
											//   listingId: listing.id, // This line was removed as per the new_code
											//   paymentMethod: purchaseDetails?.paymentMethod, // This line was removed as per the new_code
											//   shippingAddress: purchaseDetails?.shippingAddress, // This line was removed as per the new_code
											// }); // This line was removed as per the new_code
										}}
										variant="grid"
										eager={index < 4}
									/>
								),
							)}
						</div>
					</>
				)}
			</div>
		</div>
	);
}
