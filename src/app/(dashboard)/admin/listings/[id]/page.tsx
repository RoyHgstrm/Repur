"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { toast } from "~/components/ui/use-toast";

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
  images: z.array(z.string()).optional(),
});

export default function EditListingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id as string;

  const { data: listing, isLoading } = api.listings.getCompanyListingById.useQuery({ id }, { enabled: !!id });
  const updateMutation = api.listings.updateCompanyListing.useMutation({
    onSuccess: () => {
      toast({ title: "Tallennettu", description: "Listaus päivitetty.", variant: "success" });
      router.push("/admin");
    },
    onError: (error) => {
      toast({ title: "Virhe", description: error.message, variant: "destructive" });
    },
  });

  const [form, setForm] = useState({
    title: "",
    description: "",
    cpu: "",
    gpu: "",
    ram: "",
    storage: "",
    motherboard: "",
    powerSupply: "",
    caseModel: "",
    basePrice: "",
    condition: "Hyvä",
    images: [] as string[],
  });

  // Kuvien hallinta (esikatselu, lisääminen, järjestäminen, poisto)
  const fileInputRef = useRef<HTMLInputElement>(null);
  // object URLs eivät tarpeen, koska API palauttaa valmiit URL:t

  useEffect(() => {
    if (!listing) return;
    setForm({
      title: listing.title ?? "",
      description: listing.description ?? "",
      cpu: listing.cpu ?? "",
      gpu: listing.gpu ?? "",
      ram: listing.ram ?? "",
      storage: listing.storage ?? "",
      motherboard: listing.motherboard ?? "",
      powerSupply: listing.powerSupply ?? "",
      caseModel: listing.caseModel ?? "",
      basePrice: listing.basePrice ?? "",
      condition: (listing.condition as any) ?? "Hyvä",
      images: listing.images ?? [],
    });
  }, [listing]);

  const handle = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const submit = () => {
    if (!id) return;
    const payload: any = { id };
    const pushIfChanged = <K extends keyof typeof form>(key: K, map?: (v: string) => any) => {
      const current = (listing?.[key as keyof typeof listing] as any) ?? "";
      const next = form[key];
      if (typeof next !== 'string') return; // käsittele vain string-kentät
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
    if (form.images && form.images.length) payload.images = form.images;

    const parsed = UpdateSchema.safeParse(payload);
    if (!parsed.success) {
      toast({ title: "Virheellinen syöte", description: parsed.error.issues[0]?.message ?? "Tarkista kentät", variant: "destructive" });
      return;
    }
    updateMutation.mutate(parsed.data);
  };

  return (
    <div className="container mx-auto px-container py-section">
      <Card className="bg-[var(--color-surface-2)] border-[var(--color-border)]">
        <CardHeader>
          <CardTitle className="text-2xl-fluid font-semibold">Muokkaa listausta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading || !listing ? (
            <p className="text-[var(--color-text-secondary)]">Ladataan...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Otsikko</Label>
                <Input value={form.title} onChange={(e) => handle("title", e.target.value)} />
              </div>

              {/* Tuotekuvat */}
              <div className="space-y-2 md:col-span-2">
                <Label className="font-semibold">Tuotekuvat (max 10)</Label>
                <Input
                  ref={fileInputRef}
                  id="images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={async (e) => {
                    const files = e.target.files ? Array.from(e.target.files) : [];
                    if (files.length === 0) return;
                    const remaining = 10 - (form.images?.length ?? 0);
                    if (files.length > remaining) {
                      toast({ title: "Liian monta kuvaa", description: `Voit lisätä vielä ${remaining} kuvaa (yhteensä 10).`, variant: "destructive" });
                      return;
                    }
                    try {
                      const fd = new FormData();
                      files.forEach((f) => fd.append('images', f));
                      const res = await fetch('/api/upload', { method: 'POST', body: fd });
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error((err as any)?.error ?? 'Kuvien lähetys epäonnistui');
                      }
                      const data = await res.json() as { imageUrls: string[] };
                      setForm((p) => ({ ...p, images: [...(p.images ?? []), ...data.imageUrls] }));
                      // Päivitä esikatselu: käytä verkko-osoitteita eikä objectURL:ia (nämä ovat valmiita URL:eja)
                      // Tyhjennä input
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    } catch (err: any) {
                      toast({ title: 'Virhe', description: String(err?.message ?? err), variant: 'destructive' });
                    }
                  }}
                  className="bg-[var(--color-surface-3)] border-[var(--color-border)] text-[var(--color-neutral)] file:text-[var(--color-primary)] file:font-semibold"
                />

                {(form.images?.length ?? 0) > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {(form.images ?? []).map((url, idx) => (
                        <div key={`${url}-${idx}`} className="relative group rounded-lg overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-3)]">
                          {/* preview */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`kuva-${idx + 1}`} className="w-full h-64 object-contain" />
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
                                  [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
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
                                if (idx === (form.images?.length ?? 1) - 1) return;
                                setForm((p) => {
                                  const next = [...(p.images ?? [])];
                                  [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
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
                                setForm((p) => ({ ...p, images: (p.images ?? []).filter((_, i) => i !== idx) }));
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
                          setForm((p) => ({ ...p, images: [] }));
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                      >
                        Poista kaikki kuvat
                      </Button>
                    </div>
                  </div>
                )}
                <p className="text-xs text-[var(--color-text-tertiary)]">Ensimmäinen kuva näytetään listauksessa ensimmäisenä.</p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Kuvaus</Label>
                <Textarea rows={5} value={form.description} onChange={(e) => handle("description", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>CPU</Label>
                <Input value={form.cpu} onChange={(e) => handle("cpu", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>GPU</Label>
                <Input value={form.gpu} onChange={(e) => handle("gpu", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>RAM</Label>
                <Input value={form.ram} onChange={(e) => handle("ram", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tallennustila</Label>
                <Input value={form.storage} onChange={(e) => handle("storage", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Emolevy (valinnainen)</Label>
                <Input value={form.motherboard} onChange={(e) => handle("motherboard", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Virtalähde</Label>
                <Input value={form.powerSupply} onChange={(e) => handle("powerSupply", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Kotelo</Label>
                <Input value={form.caseModel} onChange={(e) => handle("caseModel", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Perushinta (€)</Label>
                <Input type="number" value={form.basePrice} onChange={(e) => handle("basePrice", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Kunto</Label>
                <Select value={form.condition} onValueChange={(v) => handle("condition", v)}>
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
                <Button variant="outline" onClick={() => router.push("/admin")}>Peruuta</Button>
                <Button onClick={submit} disabled={updateMutation.status === 'pending'}>
                  {updateMutation.status === 'pending' ? 'Tallennetaan…' : 'Tallenna muutokset'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


