import { Suspense } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import PurchaseStatusClient from "./purchase-status-client"; // Import the new client component
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Loader2 } from "lucide-react";

export default async function OstosVahvistusPage() {
	const header = await headers(); // Await the headers() call
	const searchParams = new URLSearchParams(header.get("referer") ?? "");
	const checkoutSessionId = searchParams.get("session_id");

	// If there's no checkoutSessionId, it means the user didn't come from a Stripe checkout, so redirect.
	if (!checkoutSessionId) {
		redirect("/");
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-[var(--color-surface-1)] p-4">
			<Suspense
				fallback={
					<Card className="w-full max-w-md mx-auto">
						<CardHeader className="text-center">
							<CardTitle className="text-2xl font-bold">Ostoksen vahvistus</CardTitle>
							<CardDescription>Ladataan vahvistustietoja...</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col items-center justify-center p-6">
							<Loader2 className="h-12 w-12 animate-spin text-[var(--color-primary)]" />
							<p className="mt-4 text-[var(--color-text-secondary)]">Odota hetki...</p>
						</CardContent>
					</Card>
				}
			>
				<PurchaseStatusClient checkoutSessionId={checkoutSessionId} />
			</Suspense>
		</div>
	);
}
