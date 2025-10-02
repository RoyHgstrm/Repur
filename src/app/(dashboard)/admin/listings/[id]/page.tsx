import { notFound } from "next/navigation";
import { api } from "~/trpc/server"; // Import server-side tRPC
import { getImage } from "~/server/utils/image"; // Import server-side getImage utility
import EditListingClient from "./edit-listing-client"; // Import the client component
import type { RouterOutputs } from "~/trpc/react";

// Define the type for a listing with pre-resolved image URLs
type ListingWithResolvedImages =
	RouterOutputs["listings"]["getCompanyListingById"] & {
		images: string[]; // images will be resolved to public URLs here
	};

export default async function EditListingServerPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const resolvedParams = await params; // Await params here
	const id = resolvedParams.id;

	if (!id) {
		notFound();
	}

	// Fetch listing data on the server
	const listing = await api().listings.getCompanyListingById({ id });

	if (!listing) {
		notFound();
	}

	// Resolve image paths to public URLs on the server
	const resolvedImages = await Promise.all(
		(listing.images ?? []).map(
			async (imagePath: string) => await getImage(imagePath),
		),
	);

	// Create a new listing object with resolved image URLs for the client component
	const listingWithResolvedImages: ListingWithResolvedImages = {
		...listing,
		images: resolvedImages,
	};

	return <EditListingClient initialListing={listingWithResolvedImages} />;
}
