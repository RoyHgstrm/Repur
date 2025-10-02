"use client"; // Error components must be Client Components

import { useEffect } from "react";
import { Button } from "~/components/ui/button";

export const runtime = "nodejs";

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		// Log the error to an error reporting service
		console.error(error);
	}, [error]);

	return (
		<div className="min-h-screen bg-gradient-to-br from-[var(--color-surface-1)] via-[var(--color-surface-2)] to-[var(--color-surface-1)] flex items-center justify-center">
			<div className="text-center space-y-4">
				<div className="text-6xl">😞</div>
				<h2 className="text-2xl-fluid font-bold text-primary">
					Jotain meni pieleen
				</h2>
				<p className="text-secondary">
					Pahoittelut, odottamaton virhe tapahtui.
				</p>
				<Button onClick={() => reset()} variant="outline">
					Yritä uudelleen
				</Button>
			</div>
		</div>
	);
}
