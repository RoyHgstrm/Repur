import { Button } from "~/components/ui/button";
import Link from "next/link";

export const runtime = "nodejs";

export default function NotFound() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-[var(--color-surface-1)] via-[var(--color-surface-2)] to-[var(--color-surface-1)] flex items-center justify-center">
			<div className="text-center space-y-4">
				<div className="text-6xl">🕵️‍♂️</div>
				<h2 className="text-2xl-fluid font-bold text-primary">
					404 - Sivua ei löytynyt
				</h2>
				<p className="text-secondary">
					Pahoittelut, etsimääsi sivua ei löytynyt.
				</p>
				<Button asChild variant="outline">
					<Link href="/">Palaa etusivulle</Link>
				</Button>
			</div>
		</div>
	);
}
