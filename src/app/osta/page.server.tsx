import { api } from "~/trpc/server";
import OstaPageClient from "./client-page"; // HOW: Update import to reference the renamed client component. WHY: The client component was renamed to avoid conflicts with the server component route.

interface OstaPageProps {
	searchParams: {
		search?: string;
		sortBy?: "price-low" | "price-high" | "newest" | "rating";
		filterCondition?: string;
		perfTier?: "all" | "Huippusuoritus" | "Erinomainen" | "Hyvä" | "Perus";
		gpuTier?: | "all" | "RTX50" | "RTX40" | "RTX30" | "RTX20" | "GTX" | "RX9000" | "RX8000" | "RX7000" | "RX6000" | "RX5000" | "ARC";
		cpuTier?: | "all" | "IntelCore3" | "IntelCore5" | "IntelCore7" | "IntelCore9" | "IntelUltra5" | "IntelUltra7" | "IntelUltra9" | "Ryzen3" | "Ryzen5" | "Ryzen7" | "Ryzen9";
		priceMin?: string;
		priceMax?: string;
		featuredOnly?: string;
	};
}

export default async function OstaPageServer({
	searchParams,
}: OstaPageProps) {
	const sortBy = searchParams.sortBy ?? "newest";
	const filterCondition = searchParams.filterCondition ?? "all";
	const perfTier = searchParams.perfTier ?? "all";
	const gpuTier = searchParams.gpuTier ?? "all";
	const cpuTier = searchParams.cpuTier ?? "all";
	const priceMin = searchParams.priceMin ? Number(searchParams.priceMin) : undefined;
	const priceMax = searchParams.priceMax ? Number(searchParams.priceMax) : undefined;
	const featuredOnly = searchParams.featuredOnly === "true";

	const initialListings = await api().listings.searchCompanyListings({
		searchTerm: searchParams.search,
		sortBy,
		filterCondition,
		perfTier,
		gpuTier,
		cpuTier,
		priceMin,
		priceMax,
		featuredOnly,
	});

	return (
		<OstaPageClient
			initialListings={initialListings}
			initialSearchTerm={searchParams.search}
			initialSortBy={sortBy}
			initialFilterCondition={filterCondition}
			initialPerfTier={perfTier}
			initialGpuTier={gpuTier}
			initialCpuTier={cpuTier}
			initialPriceMin={searchParams.priceMin}
			initialPriceMax={searchParams.priceMax}
			initialFeaturedOnly={featuredOnly}
		/>
	);
}
