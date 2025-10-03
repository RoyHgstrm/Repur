"use client";

import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";
import { toast } from "~/components/ui/use-toast";
import { Loader2, CheckCircle2, XCircle, HomeIcon } from "lucide-react";
import { format } from "date-fns";
import { fi } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import Link from "next/link";

interface PurchaseStatusClientProps {
	checkoutSessionId: string;
}

export default function PurchaseStatusClient({ checkoutSessionId }: PurchaseStatusClientProps) {
	const [status, setStatus] = useState<"processing" | "completed" | "failed" | null>("processing");
	const [purchaseDetails, setPurchaseDetails] = useState<RouterOutputs['purchases']['getPurchaseIdByCheckoutSession']['purchase'] | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const { data: purchaseResponse, error: purchaseError } = api.purchases.getPurchaseIdByCheckoutSession.useQuery(
		{
			checkoutSessionId: checkoutSessionId!,
		},
		{
			enabled: !!checkoutSessionId && status === "processing",
			staleTime: 1000 * 30, // 30 seconds
		},
	);

	// HOW: Handle purchase data after it's successfully fetched
	// WHY: To update the purchase status and ID once the data is available
	useEffect(() => {
		if (purchaseResponse?.purchase) {
			setPurchaseDetails(purchaseResponse.purchase);
			setStatus("completed");
		} else if (purchaseError) {
			setStatus("failed");
			setErrorMessage("Ostotapahtuman vahvistus epäonnistui.");
		}
	}, [purchaseResponse, purchaseError]);

	// HOW: Display a toast notification for purchase errors
	// WHY: To inform the user about any issues during the purchase verification
	useEffect(() => {
		if (purchaseError) {
			toast({
				title: "Virhe",
				description: purchaseError.message || "Ostotapahtuman vahvistus epäonnistui.",
				variant: "destructive",
			});
		}
	}, [purchaseError]);

	useEffect(() => {
		// If the component successfully fetched data or encountered an error,
		// but the status is still 'processing', it means something went wrong
		// or the data hasn't propagated fully.
		// We'll add a timeout here as a safeguard.
		if (status === "processing") {
			const timeout = setTimeout(() => {
				if (status === "processing") {
					setStatus("failed");
					setErrorMessage("Ostotapahtuman vahvistus aikakatkaistiin. Ota yhteyttä asiakaspalveluun.");
				}
			}, 30000); // 30 seconds timeout
			return () => clearTimeout(timeout);
		}
	}, [status]);

	if (status === "processing") {
		return (
			<Card className="w-full max-w-md mx-auto">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl font-bold">Ostoksen vahvistus</CardTitle>
					<CardDescription>Vahvistetaan ostotapahtumaasi...</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col items-center justify-center p-6">
					<Loader2 className="h-12 w-12 animate-spin text-[var(--color-primary)]" />
					<p className="mt-4 text-[var(--color-text-secondary)]">Odota hetki...</p>
				</CardContent>
			</Card>
		);
	}

	if (status === "completed" && purchaseDetails) {
		return (
			<Card className="w-full max-w-md mx-auto">
				<CardHeader className="text-center">
					<CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
					<CardTitle className="text-2xl font-bold text-green-600">Ostos vahvistettu!</CardTitle>
					<CardDescription>Kiitos tilauksestasi. Saat pian sähköpostiisi vahvistuksen.</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col items-center p-6">
					<p className="text-[var(--color-text-secondary)]">Ostotunnus: {purchaseDetails.id}</p>
					<p className="text-[var(--color-text-secondary)]">Ostopäivä: {format(new Date(purchaseDetails.createdAt), "dd.MM.yyyy HH:mm", { locale: fi })}</p>
					{purchaseDetails.companyListing && (
						<div className="mt-4 text-left w-full">
							<h3 className="text-lg font-semibold">Tuotetiedot:</h3>
							<p>Nimi: {purchaseDetails.companyListing.title}</p>
							<p>Hinta: {purchaseDetails.purchasePrice} €</p>
						</div>
					)}
					<div className="mt-4 text-left w-full">
						<h3 className="text-lg font-semibold">Toimitusosoite:</h3>
						<p>{purchaseDetails.shippingAddress}</p>
					</div>
					<div className="mt-4 text-left w-full">
						<h3 className="text-lg font-semibold">Maksutapa:</h3>
						<p>{purchaseDetails.paymentMethod}</p>
					</div>
					<Link href="/" passHref className="mt-6">
						<Button className="flex items-center gap-2">
							<HomeIcon className="h-5 w-5" />
							Takaisin etusivulle
						</Button>
					</Link>
				</CardContent>
			</Card>
		);
	}

	if (status === "failed" && errorMessage) {
		return (
			<Card className="w-full max-w-md mx-auto border-red-500">
				<CardHeader className="text-center">
					<XCircle className="mx-auto h-16 w-16 text-red-500" />
					<CardTitle className="text-2xl font-bold text-red-600">Ostosvahvistus epäonnistui</CardTitle>
					                    <CardDescription>{errorMessage}</CardDescription>
					                </CardHeader>
					                <CardContent className="flex flex-col items-center p-6">
					                    {purchaseDetails && (
					                        <div className="mt-4 text-left w-full">
					                            <p className="text-[var(--color-text-secondary)]">Ostotunnus: {purchaseDetails.id}</p>
					                            {purchaseDetails.companyListing && (
					                                <p className="text-[var(--color-text-secondary)]">Tuote: {purchaseDetails.companyListing.title}</p>
					                            )}
					                            <p className="text-[var(--color-text-secondary)]">Hinta: {purchaseDetails.purchasePrice} €</p>
					                            <p className="text-[var(--color-text-secondary)]">Maksutapa: {purchaseDetails.paymentMethod}</p>
					                        </div>
					                    )}
					                    <Link href="/" passHref className="mt-6">						<Button className="flex items-center gap-2">
							<HomeIcon className="h-5 w-5" />
							Takaisin etusivulle
						</Button>
					</Link>
				</CardContent>
				<PurchaseErrorToast message={errorMessage} />
			</Card>
		);
	}

	return null; // Should not reach here if logic is sound
}

// A small client component to render the toast, isolated from the main logic.
export function PurchaseErrorToast({ message }: { message: string }) {
	useEffect(() => {
		toast({
			title: "Ostosvahvistus epäonnistui",
			description: message,
			variant: "destructive",
		});
	}, [message]);
	return null;
}
