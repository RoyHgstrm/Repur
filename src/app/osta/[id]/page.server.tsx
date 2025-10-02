import type { Metadata } from "next";
import { api } from "~/trpc/server";
import ListingDetailPage from "./page";

type Props = {
	params: { id: string };
};

// HOW: Generate dynamic metadata for each listing
// WHY: Ensure proper SEO and social sharing previews
export async function generateMetadata({ params }: Props): Promise<Metadata> {
	try {
		const listing = await api().listings.getCompanyListingById({
			id: params.id,
		});
		if (!listing) {
			return {
				title: "Listaus ei löytynyt | Repur.fi",
				description: "Pyydettyä kohdetta ei ole tai se on poistettu.",
				openGraph: {
					title: "Listaus ei löytynyt | Repur.fi",
					description: "Pyydettyä kohdetta ei ole tai se on poistettu.",
					type: "website",
					images: [
						{
							url: "https://repur.fi/repur-fi-3.png",
							width: 1200,
							height: 630,
							alt: "Repur.fi",
						},
					],
				},
			};
		}

		// Format price with potential discount
		const basePriceNum = Number(listing.basePrice ?? 0);
		const discountAmountNum = listing.discountAmount
			? Number(listing.discountAmount)
			: 0;
		const now = new Date();
		const hasDiscount =
			listing.discountStart && listing.discountEnd
				? now >= new Date(listing.discountStart) &&
					now <= new Date(listing.discountEnd)
				: false;
		const finalPrice =
			hasDiscount && discountAmountNum > 0
				? Math.max(0, basePriceNum - discountAmountNum)
				: basePriceNum;

		// Build specs string for description
		const specs = [
			listing.cpu && `CPU: ${listing.cpu}`,
			listing.gpu && `GPU: ${listing.gpu}`,
			listing.ram && `RAM: ${listing.ram}`,
			listing.storage && `Tallennustila: ${listing.storage}`,
		]
			.filter(Boolean)
			.join(" | ");

		// Build rich metadata
		const title = `${listing.title} | Premium Gaming PC | Repur.fi`;
		const description = `${specs} | ${finalPrice}€ | Saatavuus: ${listing.status === "ACTIVE" ? "Varastossa" : "Myyty"} | Kunto: Kunnostettu | 12kk takuu ja ilmainen toimitus | Kunnostettu ja testattu pelikone luotettavasti Suomesta`;
		const url = `https://repur.fi/osta/${params.id}`;

		return {
			title,
			description,
			metadataBase: new URL("https://repur.fi"),
			alternates: {
				canonical: url,
			},
			openGraph: {
				title,
				description,
				url,
				siteName: "Repur.fi",
				type: "website",
				locale: "fi_FI",
				images: [
					{
						url: `/osta/${params.id}/opengraph-image`,
						width: 1200,
						height: 630,
						alt: listing.title,
					},
				],
			},
			twitter: {
				card: "summary_large_image",
				title,
				description,
				images: [`/osta/${params.id}/opengraph-image`],
				site: "@repurfi",
				creator: "@repurfi",
			},
			// Structured data for rich search results
			other: {
				"application/ld+json": JSON.stringify({
					"@context": "https://schema.org",
					"@type": "Product",
					name: listing.title,
					description: listing.description,
					image: Array.isArray(listing.images) ? listing.images : [],
					offers: {
						"@type": "Offer",
						price: finalPrice,
						priceCurrency: "EUR",
						availability:
							listing.status === "ACTIVE"
								? "https://schema.org/InStock"
								: "https://schema.org/OutOfStock",
						seller: {
							"@type": "Organization",
							name: "Repur.fi",
							url: "https://repur.fi",
						},
					},
					brand: {
						"@type": "Brand",
						name: "Repur.fi",
					},
					itemCondition: "https://schema.org/RefurbishedCondition",
					additionalProperty: [
						{
							"@type": "PropertyValue",
							name: "CPU",
							value: listing.cpu,
						},
						{
							"@type": "PropertyValue",
							name: "GPU",
							value: listing.gpu,
						},
						{
							"@type": "PropertyValue",
							name: "RAM",
							value: listing.ram,
						},
						{
							"@type": "PropertyValue",
							name: "Storage",
							value: listing.storage,
						},
					],
				}),
			},
		};
	} catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
		return {
			title: "Virhe | Repur.fi",
			description: "Tapahtui virhe sivun lataamisessa.",
		};
	}
}

export default ListingDetailPage;
