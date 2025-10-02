"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { toast } from "~/components/ui/use-toast";
import Image from "next/image"; // Import next/image for optimized image display
import type { RouterOutputs } from "~/trpc/react";

// Define the type for a listing with pre-resolved image URLs
type ListingWithResolvedImages =
	RouterOutputs["listings"]["getCompanyListingById"] & {
		images: string[]; // images will be resolved to public URLs here
	};

const UpdateSchema = z.object({
	id: z.string(),
	title: z.string().min(5, "Otsikko on liian lyhyt").optional(),
	description: z.string().min(10).max(2048).optional(),
	cpu: z.string().optional(),
	gpu: z.string().optional(),
	ram: z.string().optional(),
	storage: z.string().optional(),
	motherboard: z.string().optional(),
	powerSupply: z.string().optional(),
	caseModel: z.string().optional(),
	basePrice: z.number().positive().optional(),
	condition: z.enum(["Uusi", "Kuin uusi", "Hyvä", "Tyydyttävä"]).optional(),
	images: z.array(z.string()).optional(), // Ensure images are an array of strings (paths)
});

// Accept initialListing as a prop, which already has resolved image URLs
export default function EditListingPage({
	initialListing,
}: {
	initialListing: ListingWithResolvedImages;
}) {
	const router = useRouter();
	const id = initialListing.id; // Use ID from initialListing

	const updateMutation = api.listings.updateCompanyListing.useMutation({
		onSuccess: () => {
			toast({
				title: "Tallennettu",
				description: "Listaus päivitetty.",
				variant: "success",
			});
			router.push("/admin");
		},
		onError: (error) => {
			toast({
				title: "Virhe",
				description: error.message,
				variant: "destructive",
			});
		},
	});

	const [form, setForm] = useState({
		title: initialListing.title ?? "",
		description: initialListing.description ?? "",
		cpu: initialListing.cpu ?? "",
		gpu: initialListing.gpu ?? "",
		ram: initialListing.ram ?? "",
		storage: initialListing.storage ?? "",
		motherboard: initialListing.motherboard ?? "",
		powerSupply: initialListing.powerSupply ?? "",
		caseModel: initialListing.caseModel ?? "",
		basePrice: initialListing.basePrice ?? "",
		condition: (initialListing.condition as any) ?? "Hyvä",
		images: initialListing.images ?? [], // Directly use resolved images from initialListing
	});

	const fileInputRef = useRef<HTMLInputElement>(null);

	const handle = (k: keyof typeof form, v: string) =>
		setForm((p) => ({ ...p, [k]: v }));

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFiles = Array.from(e.target.files || []);
		const validFiles: File[] = [];

		for (const file of selectedFiles) {
			if (file.size > 5 * 1024 * 1024) {
				toast({
					title: "Virhe",
					description: `Kuva ${file.name} on liian suuri (max 5 Mt).`,
					variant: "destructive",
				});
				continue;
			}
			if (!["image/jpeg", "image/png"].includes(file.type)) {
				toast({
					title: "Virhe",
					description: `Kuva ${file.name} on väärää tyyppiä. Vain JPG/PNG sallittu.`,
					variant: "destructive",
				});
				continue;
			}
			validFiles.push(file);
		}

		for (const file of validFiles) {
			const formData = new FormData();
			formData.append("images", file); // Use 'images' key for multiple files
			try {
				const response = await fetch("/api/upload", {
					method: "POST",
					body: formData,
				});
				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					throw new Error(
						errorData.error || `Kuvan ${file.name} lataus epäonnistui.`,
					);
				}
				const result = (await response.json()) as { imageUrls: string[] }; // Expect imageUrls array
				setForm((prev) => ({
					...prev,
					images: [...prev.images, ...result.imageUrls],
				})); // Add new image paths
				toast({
					title: "Onnistui",
					description: `Kuva ${file.name} ladattu.`,
					variant: "success",
				});
			} catch (error: any) {
				toast({
					title: "Virhe",
					description:
						error?.message ?? `Kuvan ${file.name} lataus epäonnistui.`,
					variant: "destructive",
				});
			}
		}
		if (fileInputRef.current) fileInputRef.current.value = ""; // Clear file input
	};

	const submit = () => {
		if (!id) return;
		const payload: any = { id };
		const pushIfChanged = <K extends keyof typeof form>(
			key: K,
			map?: (v: string) => any,
		) => {
			// Use initialListing for comparison
			const current =
				(initialListing?.[key as keyof typeof initialListing] as any) ?? "";
			const next = form[key];
			if (typeof next !== "string") return; // Only process string fields
			if (String(current) !== next && next !== "") {
				payload[key as string] = map ? map(next) : next;
			}
		};
		pushIfChanged("title");
		pushIfChanged("description");
		pushIfChanged("cpu");
		pushIfChanged("gpu");
		pushIfChanged("ram");
		pushIfChanged("storage");
		pushIfChanged("motherboard");
		pushIfChanged("powerSupply");
		pushIfChanged("caseModel");
		pushIfChanged("basePrice", (v) => Number(v));
		pushIfChanged("condition");

		// Ensure current images are always part of the payload.
		payload.images = form.images;

		const parsed = UpdateSchema.safeParse(payload);
		if (!parsed.success) {
			toast({
				title: "Virheellinen syöte",
				description: parsed.error.issues[0]?.message ?? "Tarkista kentät",
				variant: "destructive",
			});
			return;
		}
		updateMutation.mutate(parsed.data);
	};

	return (
		<div className="container mx-auto px-container py-section">
			<Card className="bg-[var(--color-surface-2)] border-[var(--color-border)]">
				<CardHeader>
					<CardTitle className="text-2xl-fluid font-semibold">
						Muokkaa listausta
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Otsikko</Label>
							<Input
								value={form.title}
								onChange={(e) => handle("title", e.target.value)}
							/>
						</div>

						{/* Tuotekuvat */}
						<div className="space-y-2 md:col-span-2">
							<Label className="font-semibold">Tuotekuvat (max 10)</Label>
							<div className="bg-[var(--color-surface-3)] border-[var(--color-border)] rounded-md p-3">
								<Input
									ref={fileInputRef}
									id="images"
									type="file"
									multiple
									accept="image/jpeg,image/png"
									onChange={handleFileChange} // Use the new handleFileChange
								/>
							</div>

							{form.images && form.images.length > 0 && (
								<div className="mt-3 space-y-2">
									<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
										{/* Use form.images directly as they are now pre-resolved public URLs */}
										{form.images.map((url: string, idx: number) => (
											<div
												key={`existing-${url}-${idx}`}
												className="relative group rounded-lg overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-3)]"
											>
												<Image
													src={url}
													alt={`Listauskuva ${idx + 1}`}
													width={320} // Example width, adjust as needed
													height={128} // Example height, adjust as needed
													className="w-full h-64 object-cover"
													priority={idx === 0} // Preload the first image
												/>
												<div className="absolute inset-x-0 bottom-0 flex gap-1 p-1 bg-[var(--color-surface-2)]/85">
													<Button
														type="button"
														variant="outline"
														size="sm"
														className="h-7 px-2 text-xs"
														onClick={() => {
															if (idx === 0) return;
															setForm((p) => {
																const next = [...(p.images ?? [])];
																[next[idx - 1], next[idx]] = [
																	next[idx],
																	next[idx - 1],
																];
																return { ...p, images: next };
															});
														}}
														aria-label="Siirrä ylös"
													>
														Ylös
													</Button>
													<Button
														type="button"
														variant="outline"
														size="sm"
														className="h-7 px-2 text-xs"
														onClick={() => {
															if (idx === (form.images?.length ?? 1) - 1)
																return;
															setForm((p) => {
																const next = [...(p.images ?? [])];
																[next[idx + 1], next[idx]] = [
																	next[idx],
																	next[idx + 1],
																];
																return { ...p, images: next };
															});
														}}
														aria-label="Siirrä alas"
													>
														Alas
													</Button>
													<Button
														type="button"
														variant="destructive"
														size="sm"
														className="h-7 px-2 text-xs ml-auto"
														onClick={() => {
															setForm((p) => ({
																...p,
																images: (p.images ?? []).filter(
																	(_img: string, i: number) => i !== idx,
																),
															}));
														}}
														aria-label="Poista kuva"
													>
														Poista
													</Button>
												</div>
											</div>
										))}
									</div>
									<div>
										<Button
											variant="ghost"
											size="sm"
											className="mt-1 text-xs text-[var(--color-error)] hover:bg-[var(--color-error)]/10"
											onClick={() => {
												setForm((p) => ({ ...p, images: [] })); // Clear all images
											}}
										>
											Poista kaikki kuvat
										</Button>
									</div>
									<p className="text-xs text-[var(--color-text-tertiary)]">
										Ensimmäinen kuva näytetään listauksessa ensimmäisenä. Uudet
										kuvat lisätään listan loppuun.
									</p>
								</div>
							)}
							<p className="text-xs text-[var(--color-text-tertiary)]">
								Ensimmäinen kuva näytetään listauksessa ensimmäisenä.
							</p>
						</div>
						<div className="space-y-2 md:col-span-2">
							<Label>Kuvaus</Label>
							<Textarea
								rows={5}
								value={form.description}
								onChange={(e) => handle("description", e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label>CPU</Label>
							<Input
								value={form.cpu}
								onChange={(e) => handle("cpu", e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label>GPU</Label>
							<Input
								value={form.gpu}
								onChange={(e) => handle("gpu", e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label>RAM</Label>
							<Input
								value={form.ram}
								onChange={(e) => handle("ram", e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label>Tallennustila</Label>
							<Input
								value={form.storage}
								onChange={(e) => handle("storage", e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label>Emolevy (valinnainen)</Label>
							<Input
								value={form.motherboard}
								onChange={(e) => handle("motherboard", e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label>Virtalähde</Label>
							<Input
								value={form.powerSupply}
								onChange={(e) => handle("powerSupply", e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label>Kotelo</Label>
							<Input
								value={form.caseModel}
								onChange={(e) => handle("caseModel", e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label>Perushinta (€)</Label>
							<Input
								type="number"
								value={form.basePrice}
								onChange={(e) => handle("basePrice", e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label>Kunto</Label>
							<Select
								value={form.condition}
								onValueChange={(v) => handle("condition", v)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Uusi">Uusi</SelectItem>
									<SelectItem value="Kuin uusi">Kuin uusi</SelectItem>
									<SelectItem value="Hyvä">Hyvä</SelectItem>
									<SelectItem value="Tyydyttävä">Tyydyttävä</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="md:col-span-2 flex justify-end gap-2 pt-2">
							<Button variant="outline" onClick={() => router.push("/admin")}>
								Peruuta
							</Button>
							<Button
								onClick={submit}
								disabled={updateMutation.status === "pending"}
							>
								{updateMutation.status === "pending"
									? "Tallennetaan…"
									: "Tallenna muutokset"}
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
