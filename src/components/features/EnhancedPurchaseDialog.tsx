"use client";

import type * as React from "react";
import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { ShieldCheck, Truck, Gauge, CheckCircle2 } from "lucide-react";
import { cn } from "~/lib/utils";
import { DialogClose } from "@radix-ui/react-dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export interface EnhancedPurchaseDialogProps {
	trigger: React.ReactNode;
	productTitle: string;
	priceEUR: number;
	onConfirm: (shippingAddress: {
		street: string;
		city: string;
		postalCode: string;
		country: string;
		phone: string;
	}) => void;
	confirmLabel?: string;
	cancelLabel?: string;
	highlights?: Array<{ icon?: React.ReactNode; text: string }>;
	className?: string;
}

export function EnhancedPurchaseDialog({
	trigger,
	productTitle,
	priceEUR,
	onConfirm,
	confirmLabel = "Jatka",
	cancelLabel = "Peruuta",
	highlights,
	className,
}: EnhancedPurchaseDialogProps) {
	const [streetAddress, setStreetAddress] = useState("");
	const [city, setCity] = useState("");
	const [postalCode, setPostalCode] = useState("");
	const [country, setCountry] = useState("Suomi"); // HOW: Set default country to "Suomi" for initial state. WHY: Ensures country is always provided to backend, matching schema requirements.
	const [phoneNumber, setPhoneNumber] = useState("");

	const defaultHighlights: Array<{ icon?: React.ReactNode; text: string }> =
		highlights ?? [
			{
				icon: <ShieldCheck className="w-4 h-4 text-[var(--color-success)]" />,
				text: "12 kuukauden takuu",
			},
			{
				icon: <Truck className="w-4 h-4 text-[var(--color-primary)]" />,
				text: "Ilmainen toimitus Suomessa",
			},
			{
				icon: <Gauge className="w-4 h-4 text-[var(--color-accent)]" />,
				text: "Testattu suorituskyky",
			},
			{
				icon: (
					<CheckCircle2 className="w-4 h-4 text-[var(--color-secondary)]" />
				),
				text: "Selkeä hinnoittelu",
			},
		];

	const formattedPrice = Number.isFinite(priceEUR) ? `${priceEUR} €` : "—";

	const handleConfirm = () => {
		onConfirm({ street: streetAddress, city, postalCode, country, phone: phoneNumber });
	};

	return (
		<Dialog>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className={cn("sm:max-w-xl", className)}>
				<DialogHeader>
					<DialogTitle className="text-xl-fluid font-bold text-[var(--color-text-primary)]">
						Vahvista osto
					</DialogTitle>
					<DialogDescription>
						Tarkista tiedot ennen jatkamista.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-4">
						<div className="text-sm text-[var(--color-text-tertiary)]">
							Tuote
						</div>
						<div className="mt-1 text-base-fluid font-medium text-[var(--color-text-primary)]">
							{productTitle}
						</div>
						<div className="mt-3 text-sm text-[var(--color-text-tertiary)]">
							Hinta
						</div>
						<div className="mt-1 text-2xl-fluid font-extrabold text-gradient-primary">
							{formattedPrice}
						</div>
					</div>

					<div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-4 space-y-4">
						<h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
							Toimitusosoite
						</h3>
						<div className="grid gap-2">
							<Label htmlFor="streetAddress">Katuosoite</Label>
							<Input
								id="streetAddress"
								value={streetAddress}
								onChange={(e) => setStreetAddress(e.target.value)}
								placeholder="Esim. Katu 1 A 2"
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="grid gap-2">
								<Label htmlFor="postalCode">Postinumero</Label>
								<Input
									id="postalCode"
									value={postalCode}
									onChange={(e) => setPostalCode(e.target.value)}
									placeholder="Esim. 00100"
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="city">Kaupunki</Label>
								<Input
									id="city"
									value={city}
									onChange={(e) => setCity(e.target.value)}
									placeholder="Esim. Helsinki"
								/>
							</div>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="country">Maa</Label>
							<Input
								id="country"
								value={country}
								onChange={(e) => setCountry(e.target.value)}
								placeholder="Esim. Suomi"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="phoneNumber">Puhelinnumero</Label>
							<Input
								id="phoneNumber"
								value={phoneNumber}
								onChange={(e) => setPhoneNumber(e.target.value)}
								placeholder="Esim. 040 123 4567"
							/>
						</div>
					</div>

					<div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-4">
						<div className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
							Sisältyy kauppaan
						</div>
						<ul className="space-y-2">
							{defaultHighlights.map((h, i) => (
								<li
									key={i}
									className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]"
								>
									{h.icon}
									<span>{h.text}</span>
								</li>
							))}
						</ul>
					</div>
				</div>

				<DialogFooter className="mt-4">
					<DialogClose asChild>
						<Button variant="outline" className="min-w-[8rem]">
							{cancelLabel}
						</Button>
					</DialogClose>
					<Button
						className={cn(
							"min-w-[10rem] bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)]",
							"hover:from-[var(--color-primary)]/90 hover:to-[var(--color-accent)]/90 text-white",
						)}
						onClick={handleConfirm}
						data-testid="confirm-purchase"
					>
						{confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default EnhancedPurchaseDialog;
