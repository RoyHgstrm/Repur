import { ImageResponse } from "next/og";
// import Image from 'next/image'; // Removed to avoid conflict
import { api } from "~/trpc/server";
import { getImage } from "~/server/utils/image"; // HOW: Import the server-side image utility.

// HOW: Define image dimensions for social sharing
// WHY: Ensure optimal display across platforms
export const size = {
	width: 1200,
	height: 630,
};

// HOW: Set content type for the generated image
// WHY: Ensure proper rendering in social media
export const contentType = "image/png";

// HOW: Generate dynamic OpenGraph image for each listing
// WHY: Create visually appealing social share previews
export default async function Image({ params }: { params: { id: string } }) {
	try {
		const listing = await api().listings.getCompanyListingById({
			id: params.id,
		});
		if (!listing) throw new Error("Listing not found");

		// Get the main image URL
		const mainImage =
			Array.isArray(listing.images) && listing.images.length > 0
				? listing.images[0] // HOW: Use the raw image URL directly from the listing. WHY: The provided image URL is already public and does not need processing.
				: `${process.env.NEXT_PUBLIC_SITE_URL || "https://repur.fi"}/repur-fi-3.png`;

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

		// Build specs string
		const specs = [
			listing.cpu && `CPU: ${listing.cpu}`,
			listing.gpu && `GPU: ${listing.gpu}`,
			listing.ram && `RAM: ${listing.ram}`,
			listing.storage && `Tallennustila: ${listing.storage}`,
		].filter(Boolean);

		return new ImageResponse(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
					backgroundColor: "#0b1220",
					padding: 40,
				}}
			>
				{/* Logo and Title Bar */}
				<div
					style={{ display: "flex", alignItems: "center", marginBottom: 30 }}
				>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src="https://repur.fi/repur-fi-2.png"
						alt="Repur.fi logo"
						width={120}
						height={40}
						style={{ marginRight: 20 }}
					/>
					<div
						style={{
							fontSize: 24,
							color: "#e5e7eb",
							fontWeight: 500,
						}}
					>
						Premium Gaming PC
					</div>
				</div>

				{/* Main Content */}
				<div
					style={{
						display: "flex",
						flex: 1,
						gap: 40,
					}}
				>
					{/* Product Image */}
					<div
						style={{
							flex: "0 0 50%",
							position: "relative",
							borderRadius: 12,
							overflow: "hidden",
							backgroundColor: "#1e293b",
						}}
					>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={mainImage}
							alt={listing.title ?? "Tuotteen kuva"}
							style={{
								width: "100%",
								height: "100%",
								objectFit: "contain",
							}}
						/>
					</div>

					{/* Product Info */}
					<div
						style={{
							flex: "0 0 45%",
							display: "flex",
							flexDirection: "column",
							justifyContent: "space-between",
						}}
					>
						{/* Title and Price */}
						<div>
							<div
								style={{
									fontSize: 32,
									fontWeight: 700,
									color: "#ffffff",
									marginBottom: 20,
									lineHeight: 1.2,
								}}
							>
								{listing.title}
							</div>
							<div
								style={{
									fontSize: 48,
									fontWeight: 800,
									color: "#3b82f6",
									marginBottom: 30,
								}}
							>
								{finalPrice} €
							</div>
						</div>

						{/* Specs */}
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								gap: 12,
							}}
						>
							{specs.map((spec, i) => (
								<div
									key={i}
									style={{
										fontSize: 20,
										color: "#94a3b8",
										padding: "8px 16px",
										backgroundColor: "#1e293b",
										borderRadius: 8,
									}}
								>
									{spec}
								</div>
							))}
						</div>

						{/* Footer */}
						<div
							style={{
								marginTop: 30,
								display: "flex",
								alignItems: "center",
								gap: 20,
							}}
						>
							<div
								style={{
									fontSize: 18,
									color: "#4ade80",
									display: "flex",
									alignItems: "center",
									gap: 8,
								}}
							>
								✓ 12kk takuu
							</div>
							<div
								style={{
									fontSize: 18,
									color: "#4ade80",
									display: "flex",
									alignItems: "center",
									gap: 8,
								}}
							>
								✓ Ilmainen toimitus
							</div>
						</div>
					</div>
				</div>
			</div>,
			{
				...size,
				fonts: [
					{
						name: "Inter",
						data: await fetch(
							new URL(
								"https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZJhiI2B.woff2",
								"https://fonts.gstatic.com",
							),
						).then((res) => res.arrayBuffer()),
						weight: 500,
						style: "normal",
					},
					{
						name: "Inter",
						data: await fetch(
							new URL(
								"https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZJhiI2B.woff2",
								"https://fonts.gstatic.com",
							),
						).then((res) => res.arrayBuffer()),
						weight: 700,
						style: "normal",
					},
				],
			},
		);
	} catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
		// Fallback image on error
		return new ImageResponse(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: "#0b1220",
					padding: 40,
				}}
			>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src="https://repur.fi/repur-fi-2.png"
					alt="Repur.fi logo"
					width={200}
					height={67}
					style={{ marginBottom: 30 }}
				/>
				<div
					style={{
						fontSize: 32,
						color: "#e5e7eb",
						textAlign: "center",
					}}
				>
					Premium Gaming PC
				</div>
			</div>,
			{
				...size,
			},
		);
	}
}
