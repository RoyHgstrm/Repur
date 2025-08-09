"use client";

import { useState } from 'react';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { toast } from '~/components/ui/use-toast';
import { z } from 'zod';
import { api } from '~/trpc/react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { useRef, useMemo, useState as useReactState } from 'react';
import { ShieldCheck, Truck, ListChecks, Layers } from "lucide-react";

// Define the Zod schema for company listings, matching the server-side schema
const CompanyListingSchema = z.object({
  title: z.string().min(5, "Otsikko on liian lyhyt"),
  description: z.string().min(10, "Kuvaus on liian lyhyt").max(2048, "Kuvaus on liian pitkä"),
  cpu: z.string(),
  gpu: z.string(),
  ram: z.string(),
  storage: z.string(),
  motherboard: z.string().optional(),
  powerSupply: z.string(),
  caseModel: z.string().optional(),
  basePrice: z.number().positive("Hinnan täytyy olla positiivinen"),
  condition: z.enum(["Uusi", "Kuin uusi", "Hyvä", "Tyydyttävä"]),
  images: z.array(z.string()).optional(),
});

type CompanyListingFormData = z.infer<typeof CompanyListingSchema>;

// Define the type for Trade-In listings based on schema
type TradeInListing = { 
  id: string; 
  title: string; 
  description: string | null; 
  cpu: string; 
  gpu: string; 
  ram: string; 
  storage: string; 
  powerSupply: string | null; 
  caseModel: string | null; 
  condition: string;
  estimatedValue: string | null; 
  contactEmail: string; 
  contactPhone: string | null; 
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CONTACTED' | 'COMPLETED';
  user?: { name: string | null; email: string | null; phone: string | null } | null;
};

export default function EmployeeDashboardPage() {
  return (
    <div className="container mx-auto px-container py-section">
      <h1 className="text-3xl-fluid sm:text-4xl-fluid lg:text-5xl-fluid font-bold mb-6 text-center text-[var(--color-neutral)]">
        Ylläpitäjän Hallintapaneeli
      </h1>

      <AdminStats />

      <Tabs defaultValue="companyListings" className="space-y-6 mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="companyListings">Yrityksen Listaukset</TabsTrigger>
          <TabsTrigger value="tradeIns">Trade-In Pyynnöt</TabsTrigger>
        </TabsList>

        <TabsContent value="companyListings">
          <div className="grid grid-cols-1 gap-6">
            <CompanyListingForm />
            <CompanyListingsManage />
          </div>
        </TabsContent>

        <TabsContent value="tradeIns">
          <TradeInListingsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AdminStats() {
  const { data: activeListings } = api.listings.getActiveCompanyListings.useQuery();
  const { data: pendingTradeIns } = api.listings.getPendingTradeInListings.useQuery();
  const { data: myListings } = api.listings.getUserCompanyListings.useQuery();

  const stats = useMemo(() => ([
    {
      icon: <Layers className="w-5 h-5" />,
      label: 'Aktiiviset listaukset',
      value: activeListings?.length ?? 0,
    },
    {
      icon: <ListChecks className="w-5 h-5" />,
      label: 'Odottaa trade‑in',
      value: pendingTradeIns?.length ?? 0,
    },
    {
      icon: <ShieldCheck className="w-5 h-5" />,
      label: 'Omat listaukset',
      value: myListings?.length ?? 0,
    },
  ]), [activeListings, pendingTradeIns, myListings]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((s, i) => (
        <Card key={i} className="bg-[var(--color-surface-2)] border-[var(--color-border)]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-[var(--color-text-tertiary)]">{s.label}</div>
              <div className="text-2xl-fluid font-bold text-[var(--color-text-primary)]">{s.value}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-3)] flex items-center justify-center text-[var(--color-primary)]">
              {s.icon}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CompanyListingForm() {
  const [formData, setFormData] = useState<CompanyListingFormData>({
    title: '',
    description: '',
    cpu: '',
    gpu: '',
    ram: '',
    storage: '',
    motherboard: '',
    powerSupply: '',
    caseModel: '',
    basePrice: 0,
    condition: 'Hyvä',
    images: [], // Initialize images as an empty array
  });

  const [selectedImage, setSelectedImage] = useState<File[]>([]); // New state for selected image files (array)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [objectUrls, setObjectUrls] = useState<string[]>([]);

  // No longer need fileToBase64 as we'll send FormData directly
  // const fileToBase64 = (file: File): Promise<string> => {
  //   return new Promise((resolve, reject) => {
  //     const reader = new FileReader();
  //     reader.readAsDataURL(file);
  //     reader.onload = () => resolve(reader.result as string);
  //     reader.onerror = (error) => reject(error);
  //   });
  // };

  const createCompanyListingMutation = api.listings.createCompanyListing.useMutation({
    onSuccess: () => {
      toast({
        title: "Listaus luotu",
        description: "Uusi yrityksen listaus on luotu onnistuneesti.",
        variant: "success"
      });
      setFormData({
        title: '',
        description: '',
        cpu: '',
        gpu: '',
        ram: '',
        storage: '',
        motherboard: '',
        powerSupply: '',
        caseModel: '',
        basePrice: 0,
        condition: 'Hyvä',
        images: [], // Reset images on success
      });
      setSelectedImage([]); // Reset selected images on success
    },
    onError: (error: { message: string }) => {
      toast({
        title: "Virhe listauksen luomisessa",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleInputChange = (field: keyof CompanyListingFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'basePrice' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = CompanyListingSchema.parse({
        ...formData,
        basePrice: parseFloat(formData.basePrice.toString()),
      });

      let uploadedImageUrls: string[] = [];
      if (selectedImage.length > 0) {
        const uploadFormData = new FormData();
        selectedImage.forEach((file) => {
          uploadFormData.append('images', file);
        });

        // Send files to the local upload API route
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json() as { error?: string };
          throw new Error(errorData.error || 'Failed to upload images.');
        }

        const result = await uploadResponse.json() as { imageUrls: string[] };
        uploadedImageUrls = result.imageUrls;
      }

      createCompanyListingMutation.mutate({
        ...validatedData,
        images: uploadedImageUrls,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.issues.forEach(issue => {
          toast({
            title: "Virheellinen syöte",
            description: issue.message,
            variant: "destructive"
          });
        });
      } else if (error instanceof Error) {
        toast({
          title: "Virhe",
          description: error.message,
          variant: "destructive"
        });
      }
    }
  };

  return (
    <Card className="bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-neutral)]">
      <CardHeader>
        <CardTitle className="text-2xl-fluid font-semibold">Luo Uusi Yrityksen Listaus</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            placeholder="Otsikko (esim. Tehokas Pelitietokone)" 
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="bg-[var(--color-surface-3)] border-[var(--color-border)] text-[var(--color-neutral)] placeholder-[var(--color-neutral)]/50 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
          />
          <Textarea 
            placeholder="Kuvaus tietokoneesta (sisältäen tiedot kuten käyttöjärjestelmä, erikoisominaisuudet jne.)" 
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={5}
            className="bg-[var(--color-surface-3)] border-[var(--color-border)] text-[var(--color-neutral)] placeholder-[var(--color-neutral)]/50 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input 
              placeholder="Prosessori (esim. Intel Core i7-10700K)" 
              value={formData.cpu}
              onChange={(e) => handleInputChange('cpu', e.target.value)}
              className="bg-[var(--color-surface-3)] border-[var(--color-border)] text-[var(--color-neutral)] placeholder-[var(--color-neutral)]/50 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
            />
            <Input 
              placeholder="Näytönohjain (esim. NVIDIA GeForce RTX 3080)" 
              value={formData.gpu}
              onChange={(e) => handleInputChange('gpu', e.target.value)}
              className="bg-[var(--color-surface-3)] border-[var(--color-border)] text-[var(--color-neutral)] placeholder-[var(--color-neutral)]/50 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
            />
            <Input 
              placeholder="RAM (esim. 16GB DDR4)" 
              value={formData.ram}
              onChange={(e) => handleInputChange('ram', e.target.value)}
              className="bg-[var(--color-surface-3)] border-[var(--color-border)] text-[var(--color-neutral)] placeholder-[var(--color-neutral)]/50 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
            />
            <Input 
              placeholder="Tallennustila (esim. 1TB NVMe SSD)" 
              value={formData.storage}
              onChange={(e) => handleInputChange('storage', e.target.value)}
              className="bg-[var(--color-surface-3)] border-[var(--color-border)] text-[var(--color-neutral)] placeholder-[var(--color-neutral)]/50 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
            />
            <Input 
              placeholder="Emolevy (esim. ASUS ROG Strix Z490)" 
              value={formData.motherboard}
              onChange={(e) => handleInputChange('motherboard', e.target.value)}
              className="bg-[var(--color-surface-3)] border-[var(--color-border)] text-[var(--color-neutral)] placeholder-[var(--color-neutral)]/50 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
            />
            <Input 
              placeholder="Virtalähde (esim. Corsair RM750x)" 
              value={formData.powerSupply}
              onChange={(e) => handleInputChange('powerSupply', e.target.value)}
              className="bg-[var(--color-surface-3)] border-[var(--color-border)] text-[var(--color-neutral)] placeholder-[var(--color-neutral)]/50 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
            />
            <Input 
              placeholder="Kotelo (esim. Lian Li O11 Dynamic)" 
              value={formData.caseModel}
              onChange={(e) => handleInputChange('caseModel', e.target.value)}
              className="bg-[var(--color-surface-3)] border-[var(--color-border)] text-[var(--color-neutral)] placeholder-[var(--color-neutral)]/50 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
            />
            <Input 
              type="number" 
              placeholder="Perushinta (€)" 
              value={formData.basePrice === 0 ? '' : formData.basePrice}
              onChange={(e) => handleInputChange('basePrice', e.target.value)}
              className="bg-[var(--color-surface-3)] border-[var(--color-border)] text-[var(--color-neutral)] placeholder-[var(--color-neutral)]/50 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image-upload" className="text-[var(--color-neutral)] font-semibold">Tuotekuvat (max 10)</Label>
            <Input
              id="images"
              type="file"
              multiple
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files) {
                  const files = Array.from(e.target.files);
                  if (files.length + selectedImage.length > 10) {
                    toast({
                      title: "Liian monta kuvaa",
                      description: "Voit ladata enintään 10 kuvaa.",
                      variant: "destructive"
                    });
                    return; 
                  }
                  // create object URLs for previews
                  const newUrls = files.map((f) => URL.createObjectURL(f));
                  setObjectUrls((prev) => [...prev, ...newUrls]);
                  setSelectedImage((prev) => [...prev, ...files]);
                } else {
                  // clear
                  objectUrls.forEach((u) => URL.revokeObjectURL(u));
                  setObjectUrls([]);
                  setSelectedImage([]);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }
              }}
              className="bg-[var(--color-surface-3)] border-[var(--color-border)] text-[var(--color-neutral)] placeholder-[var(--color-neutral)]/50 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] file:text-[var(--color-primary)] file:font-semibold"
            />
            {selectedImage.length > 0 && (
              <div className="mt-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {selectedImage.map((file, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-3)]">
                      {/* preview */}
                      <img
                        src={objectUrls[idx]}
                        alt={file.name}
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 flex gap-1 p-1 bg-[var(--color-surface-2)]/80">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => {
                            if (idx === 0) return;
                            setSelectedImage((prev) => {
                              const next = [...prev];
                              [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                              return next;
                            });
                            setObjectUrls((prev) => {
                              const next = [...prev];
                              [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                              return next;
                            });
                          }}
                        >
                          Ylös
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => {
                            if (idx === selectedImage.length - 1) return;
                            setSelectedImage((prev) => {
                              const next = [...prev];
                              [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                              return next;
                            });
                            setObjectUrls((prev) => {
                              const next = [...prev];
                              [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                              return next;
                            });
                          }}
                        >
                          Alas
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="h-7 px-2 text-xs ml-auto"
                          onClick={() => {
                            setSelectedImage((prev) => prev.filter((_, i) => i !== idx));
                            setObjectUrls((prev) => {
                              URL.revokeObjectURL(prev[idx]);
                              return prev.filter((_, i) => i !== idx);
                            });
                          }}
                        >
                          Poista
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-xs text-[var(--color-neutral)]/70">
                  Voit järjestää kuvat (ylös/alas), ensimmäinen kuva näytetään listauksessa ensimmäisenä.
                </div>
                <div className="mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      objectUrls.forEach((u) => URL.revokeObjectURL(u));
                      setObjectUrls([]);
                      setSelectedImage([]);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="mt-1 text-xs text-[var(--color-error)] hover:bg-[var(--color-error)]/10"
                  >
                    Poista kaikki kuvat
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div>
            <Select 
              value={formData.condition}
              onValueChange={(value) => handleInputChange('condition', value)}
            >
              <SelectTrigger className="w-full bg-[var(--color-surface-3)] border-[var(--color-border)] text-[var(--color-neutral)] data-[placeholder]:text-[var(--color-neutral)]/50">
                <SelectValue placeholder="Kunto" />
              </SelectTrigger>
              <SelectContent className="bg-[var(--color-surface-3)] border-[var(--color-border)] text-[var(--color-neutral)]">
                <SelectItem value="Uusi">Uusi (sinetöity)</SelectItem>
                <SelectItem value="Kuin uusi">Kuin uusi (erinomainen)</SelectItem>
                <SelectItem value="Hyvä">Hyvä (pieniä käytön jälkiä)</SelectItem>
                <SelectItem value="Tyydyttävä">Tyydyttävä (selviä naarmuja)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white py-2 px-4 rounded-md transition-colors duration-200">
            Luo Listaus
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function TradeInListingsTable() {
  const [statusFilter, setStatusFilter] = useReactState<'ALL' | 'PENDING' | 'CONTACTED' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED'>('PENDING');
  const [search, setSearch] = useReactState("");
  const { data: tradeInListings, isLoading, refetch } = api.listings.getTradeInListings.useQuery(
    { status: statusFilter === 'ALL' ? undefined : statusFilter },
    { refetchOnWindowFocus: false }
  );
  const evaluateMutation = api.listings.evaluateTradeIn.useMutation({
    onSuccess: () => {
      toast({ title: 'Päivitetty', description: 'Trade-in pyyntö päivitetty.', variant: 'success' });
      void refetch();
    },
    onError: (error) => {
      toast({ title: 'Virhe', description: error.message, variant: 'destructive' });
    }
  });
  const markContactedMutation = api.listings.markTradeInContacted.useMutation({
    onSuccess: () => {
      toast({
        title: "Käyttäjään otettu yhteyttä",
        description: "Trade-in pyyntö merkitty käsitellyksi.",
        variant: "success",
      });
      void refetch(); // Refetch listings to update status
    },
    onError: (error) => {
      toast({
        title: "Virhe",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleContactUser = (tradeInId: string) => {
    markContactedMutation.mutate({ tradeInListingId: tradeInId });
  };

  return (
    <Card className="bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-neutral)]">
      <CardHeader>
        <CardTitle className="text-2xl-fluid font-semibold">Trade-In Hallinta</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-48 h-9">
                <SelectValue placeholder="Tila" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Odottaa</SelectItem>
                <SelectItem value="CONTACTED">Kontaktoitu</SelectItem>
                <SelectItem value="ACCEPTED">Hyväksytty</SelectItem>
                <SelectItem value="REJECTED">Hylätty</SelectItem>
                <SelectItem value="COMPLETED">Valmis</SelectItem>
                <SelectItem value="ALL">Kaikki</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>Päivitä</Button>
          </div>
          <Input
            placeholder="Hae (otsikko, email, puhelin)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-xs"
          />
        </div>

        {isLoading ? (
          <p className="text-center text-[var(--color-neutral)]/80">Ladataan trade-in pyyntöjä...</p>
        ) : (tradeInListings ?? []).length === 0 ? (
          <p className="text-center text-[var(--color-neutral)]/80">Ei odottavia trade-in pyyntöjä.</p>
        ) : (
          <div className="space-y-4">
            {(tradeInListings ?? [])
              .filter((l) => {
                const q = search.trim().toLowerCase();
                if (!q) return true;
                return (
                  l.title?.toLowerCase().includes(q) ||
                  l.contactEmail?.toLowerCase().includes(q) ||
                  (l.contactPhone ?? '').toLowerCase().includes(q)
                );
              })
              .map((listing: TradeInListing) => (
              <Card key={listing.id} className="bg-[var(--color-surface-3)] border-[var(--color-border)] p-4">
                <h3 className="text-lg-fluid font-semibold text-[var(--color-neutral)]">{listing.title}</h3>
                <p className="text-[var(--color-neutral)]/80 text-sm">Käyttäjä: {listing.user?.name ?? 'Tuntematon'}</p>
                <p className="text-[var(--color-neutral)]/80 text-sm">Sähköposti: {listing.contactEmail}</p>
                {listing.contactPhone && <p className="text-[var(--color-neutral)]/80 text-sm">Puhelin: {listing.contactPhone}</p>}
                <p className="text-[var(--color-neutral)]/80 text-sm">Prosessori: {listing.cpu}</p>
                <p className="text-[var(--color-neutral)]/80 text-sm">Näytönohjain: {listing.gpu}</p>
                <p className="text-[var(--color-neutral)]/80 text-sm">RAM: {listing.ram}</p>
                <p className="text-[var(--color-neutral)]/80 text-sm">Tallennustila: {listing.storage}</p>
                <p className="text-[var(--color-neutral)]/80 text-sm">Kunto: {listing.condition}</p>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <span className="text-xs text-[var(--color-text-tertiary)]">Arvioitu arvo (€)</span>
                    <Input
                      type="number"
                      defaultValue={listing.estimatedValue ? Number(listing.estimatedValue) : ''}
                      onBlur={(e) => {
                        const value = e.target.value.trim() === '' ? undefined : Number(e.target.value);
                        if (value !== undefined && !Number.isFinite(value)) return;
                        evaluateMutation.mutate({ tradeInListingId: listing.id, status: listing.status, estimatedValue: value });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-[var(--color-text-tertiary)]">Muistiinpanot</span>
                    <Textarea
                      rows={2}
                      defaultValue={(listing as any).evaluationNotes ?? ''}
                      onBlur={(e) => {
                        const notes = e.target.value.trim() === '' ? undefined : e.target.value;
                        evaluateMutation.mutate({ tradeInListingId: listing.id, status: listing.status, evaluationNotes: notes });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-[var(--color-text-tertiary)]">Tila</span>
                    <Select value={listing.status} onValueChange={(v) => evaluateMutation.mutate({ tradeInListingId: listing.id, status: v as any })}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Odottaa</SelectItem>
                        <SelectItem value="CONTACTED">Kontaktoitu</SelectItem>
                        <SelectItem value="ACCEPTED">Hyväksytty</SelectItem>
                        <SelectItem value="REJECTED">Hylätty</SelectItem>
                        <SelectItem value="COMPLETED">Valmis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleContactUser(listing.id)}
                    disabled={markContactedMutation.status === 'pending'}
                  >
                    Merkitse kontaktoiduksi
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => evaluateMutation.mutate({ tradeInListingId: listing.id, status: 'ACCEPTED' })}
                  >
                    Hyväksy
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => evaluateMutation.mutate({ tradeInListingId: listing.id, status: 'REJECTED' })}
                  >
                    Hylkää
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => evaluateMutation.mutate({ tradeInListingId: listing.id, status: 'COMPLETED' })}
                  >
                    Merkitse valmiiksi
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CompanyListingsManage() {
  // Staff can see all listings, regular users see their own
  const { data: allListings } = api.listings.getAllCompanyListings.useQuery(undefined, { retry: 0, refetchOnWindowFocus: false });
  const { data: myListings, isLoading, refetch } = api.listings.getUserCompanyListings.useQuery(undefined, { refetchOnWindowFocus: false });
  const evaluateMutation = api.listings.evaluateCompanyListing.useMutation({
    onSuccess: () => {
      toast({ title: 'Päivitetty', description: 'Listaus päivitetty.', variant: 'success' });
      void refetch();
    },
    onError: (error) => {
      toast({ title: 'Virhe', description: error.message, variant: 'destructive' });
    }
  });
  const updateMutation = api.listings.updateCompanyListing.useMutation({
    onError: (error) => {
      toast({ title: 'Virhe', description: error.message, variant: 'destructive' });
    }
  });

  // Controls
  const [search, setSearch] = useReactState("");
  const [statusFilter, setStatusFilter] = useReactState<'ALL' | 'ACTIVE' | 'ARCHIVED' | 'SOLD'>('ALL');
  const [minPrice, setMinPrice] = useReactState<string>("");
  const [maxPrice, setMaxPrice] = useReactState<string>("");
  const [sortBy, setSortBy] = useReactState<'RECENT' | 'PRICE_ASC' | 'PRICE_DESC' | 'TITLE'>('RECENT');
  const [onlyMine, setOnlyMine] = useReactState<boolean>(false);
  const [selectedIds, setSelectedIds] = useReactState<Set<string>>(new Set());
  const [page, setPage] = useReactState<number>(1);
  const [pageSize, setPageSize] = useReactState<number>(10);
  // Bulk discount controls
  const [bulkDiscountAmount, setBulkDiscountAmount] = useReactState<string>("");
  const [bulkPresetDays, setBulkPresetDays] = useReactState<"1"|"3"|"7"|"14"|"30">("7");

  const sourceRaw = onlyMine ? (myListings ?? []) : (allListings ?? myListings ?? []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const min = minPrice === '' ? undefined : Number(minPrice);
    const max = maxPrice === '' ? undefined : Number(maxPrice);

    let items = sourceRaw.filter((l) => {
      if (statusFilter !== 'ALL' && l.status !== statusFilter) return false;
      if (min !== undefined && Number(l.basePrice) < min) return false;
      if (max !== undefined && Number(l.basePrice) > max) return false;
      if (!q) return true;
      const title = (l.title ?? '').toLowerCase();
      const sellerName = ((l as any).seller?.name ?? '').toLowerCase();
      const id = l.id.toLowerCase();
      return title.includes(q) || sellerName.includes(q) || id.includes(q);
    });

    items = items.sort((a, b) => {
      if (sortBy === 'TITLE') return (a.title ?? '').localeCompare(b.title ?? '');
      if (sortBy === 'PRICE_ASC') return Number(a.basePrice) - Number(b.basePrice);
      if (sortBy === 'PRICE_DESC') return Number(b.basePrice) - Number(a.basePrice);
      return 0; // RECENT fallback (server already returns recent first typically)
    });

    return items;
  }, [sourceRaw, statusFilter, minPrice, maxPrice, search, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, pageSafe, pageSize]);

  const toggleAll = (checked: boolean) => {
    if (checked) setSelectedIds(new Set(paged.map((x) => x.id)));
    else setSelectedIds(new Set());
  };

  const toggleOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };

  const bulkUpdateStatus = async (newStatus: 'ACTIVE' | 'ARCHIVED' | 'SOLD') => {
    if (selectedIds.size === 0) return;
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          evaluateMutation.mutateAsync({ companyListingId: id, status: newStatus })
        )
      );
      setSelectedIds(new Set());
      toast({ title: 'Päivitetty', description: 'Valitut listaukset päivitetty.', variant: 'success' });
    } catch (e: any) {
      toast({ title: 'Virhe', description: e?.message ?? 'Päivitys epäonnistui', variant: 'destructive' });
    }
  };

  const applyBulkDiscount = async () => {
    if (selectedIds.size === 0) return;
    const amount = Number(bulkDiscountAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ title: 'Virheellinen alennus', description: 'Syötä positiivinen euromäärä.', variant: 'destructive' });
      return;
    }
    const now = new Date();
    const end = new Date(now.getTime() + Number(bulkPresetDays) * 24 * 60 * 60 * 1000);
    // Format as YYYY-MM-DDTHH:mm to match datetime-local
    const fmt = (d: Date) => d.toISOString().slice(0,16);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          updateMutation.mutateAsync({
            id,
            discountAmount: amount,
            discountStart: fmt(now),
            discountEnd: fmt(end),
          } as any)
        )
      );
      toast({ title: 'Alennus asetettu', description: `Asetettiin ${amount} € alennus ${bulkPresetDays} päivän ajaksi (${selectedIds.size} kpl).`, variant: 'success' });
      setSelectedIds(new Set());
      void refetch();
    } catch (e: any) {
      toast({ title: 'Virhe', description: e?.message ?? 'Alennusten asettaminen epäonnistui', variant: 'destructive' });
    }
  };

  return (
    <Card className="bg-[var(--color-surface-2)] border-[var(--color-border)]">
      <CardHeader>
        <CardTitle className="text-2xl-fluid">Hallinnoi listauksia</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
          <Input
            placeholder="Hae (otsikko, myyjä, ID)"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="lg:col-span-4"
          />
          <div className="flex gap-2 lg:col-span-3">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as any); setPage(1); }}>
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="Tila" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Kaikki</SelectItem>
                <SelectItem value="ACTIVE">Aktiivinen</SelectItem>
                <SelectItem value="ARCHIVED">Arkistoitu</SelectItem>
                <SelectItem value="SOLD">Myyty</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="Järjestä" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RECENT">Uusimmat</SelectItem>
                <SelectItem value="PRICE_ASC">Hinta nouseva</SelectItem>
                <SelectItem value="PRICE_DESC">Hinta laskeva</SelectItem>
                <SelectItem value="TITLE">Otsikko (A–Ö)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 lg:col-span-3">
            <Input placeholder="Min €" type="number" value={minPrice} onChange={(e) => { setMinPrice(e.target.value); setPage(1); }} />
            <Input placeholder="Max €" type="number" value={maxPrice} onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }} />
          </div>
          <div className="flex items-center gap-2 lg:col-span-2">
            <Button variant={onlyMine ? 'default' : 'outline'} size="sm" onClick={() => { setOnlyMine((v) => !v); setPage(1); }}>
              {onlyMine ? 'Vain omat (päällä)' : 'Vain omat'}
            </Button>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
              <SelectTrigger className="h-9 w-24">
                <SelectValue placeholder="Sivu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10/sivu</SelectItem>
                <SelectItem value="20">20/sivu</SelectItem>
                <SelectItem value="50">50/sivu</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bulk actions */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="text-xs text-[var(--color-text-tertiary)]">Valittu: {selectedIds.size}</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => bulkUpdateStatus('ACTIVE')} disabled={selectedIds.size === 0}>Merkitse aktiiviseksi</Button>
            <Button variant="outline" size="sm" onClick={() => bulkUpdateStatus('ARCHIVED')} disabled={selectedIds.size === 0}>Arkistoi</Button>
            <Button variant="outline" size="sm" onClick={() => bulkUpdateStatus('SOLD')} disabled={selectedIds.size === 0}>Merkitse myydyksi</Button>
          </div>
          {/* Bulk discount quick controls */}
          <div className="flex items-center gap-2">
            <Input placeholder="Alennus €" type="number" className="h-8 w-28 text-xs" value={bulkDiscountAmount} onChange={(e) => setBulkDiscountAmount(e.target.value)} />
            <Select value={bulkPresetDays} onValueChange={(v) => setBulkPresetDays(v as any)}>
              <SelectTrigger className="h-8 w-28 text-xs"><SelectValue placeholder="Kesto" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 päivä</SelectItem>
                <SelectItem value="3">3 päivää</SelectItem>
                <SelectItem value="7">7 päivää</SelectItem>
                <SelectItem value="14">14 päivää</SelectItem>
                <SelectItem value="30">30 päivää</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={applyBulkDiscount} disabled={selectedIds.size === 0}>Aseta alennus</Button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-[var(--color-text-secondary)] text-sm">Ladataan...</p>
        ) : filtered.length === 0 ? (
          <p className="text-[var(--color-text-secondary)] text-sm">Ei listauksia.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--color-text-tertiary)] border-b border-[var(--color-border)]/50">
                  <th className="py-2 pr-3"><input type="checkbox" aria-label="Valitse kaikki" onChange={(e) => toggleAll(e.target.checked)} checked={paged.length > 0 && paged.every((x) => selectedIds.has(x.id))} /></th>
                  <th className="py-2 pr-3">Otsikko</th>
                  <th className="py-2 pr-3">Hinta (€)</th>
                  <th className="py-2 pr-3">Alennus</th>
                  <th className="py-2 pr-3">Tila</th>
                  <th className="py-2 pr-3 w-40">Toiminnot</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((l) => (
                  <tr key={l.id} className="border-b border-[var(--color-border)]/50">
                    <td className="py-1 px-2 align-middle">
                      <input type="checkbox" aria-label={`Valitse ${l.title ?? l.id}`} checked={selectedIds.has(l.id)} onChange={(e) => toggleOne(l.id, e.target.checked)} />
                    </td>
                    <ManageRow listing={l as any} onSave={async (payload) => {
                      const { companyListingId, status, basePrice, discountAmount, discountStart, discountEnd } = payload;
                      // First apply field updates (price/discounts)
                      if (
                        basePrice !== undefined ||
                        discountAmount !== undefined ||
                        discountStart !== undefined ||
                        discountEnd !== undefined
                      ) {
                        await updateMutation.mutateAsync({
                          id: companyListingId,
                          ...(basePrice !== undefined ? { basePrice } : {}),
                          ...(discountAmount !== undefined ? { discountAmount } : {}),
                          ...(discountStart !== undefined ? { discountStart } : {}),
                          ...(discountEnd !== undefined ? { discountEnd } : {}),
                        });
                      }
                      // Then apply status change if needed
                      if (status) {
                        await evaluateMutation.mutateAsync({ companyListingId, status });
                      }
                      void refetch();
                    }} />
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination */}
            <div className="flex items-center justify-between mt-2 text-xs">
              <div className="text-[var(--color-text-tertiary)]">Sivu {pageSafe}/{totalPages} • {filtered.length} listaus(ta)</div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pageSafe <= 1}>Edellinen</Button>
                <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={pageSafe >= totalPages}>Seuraava</Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type ManageRowProps = {
  listing: { id: string; title: string | null; status: string; basePrice: string };
  onSave: (payload: { companyListingId: string; status: any; basePrice?: number; discountAmount?: number; discountStart?: string; discountEnd?: string }) => void;
};

function ManageRow({ listing, onSave }: ManageRowProps) {
  const [price, setPrice] = useReactState<string>(listing.basePrice ?? '');
  const [status, setStatus] = useReactState<string>(listing.status);
  // Prefill active discount fields if present on the listing (supports older shapes via any)
  const initialDiscountAmount = (() => {
    const v = (listing as any).discountAmount;
    return v != null && v !== '' ? String(Number(v)) : '';
  })();
  const toLocalDatetime = (d: unknown): string => {
    if (!d) return '';
    const date = new Date(String(d));
    if (Number.isNaN(date.getTime())) return '';
    // toISOString returns Z; datetime-local expects YYYY-MM-DDTHH:mm
    return date.toISOString().slice(0, 16);
  };
  const initialStart = toLocalDatetime((listing as any).discountStart);
  const initialEnd = toLocalDatetime((listing as any).discountEnd);
  const [discountAmount, setDiscountAmount] = useReactState<string>(initialDiscountAmount);
  const [discountStart, setDiscountStart] = useReactState<string>(initialStart);
  const [discountEnd, setDiscountEnd] = useReactState<string>(initialEnd);

  return (
    <>
      <td className="py-1 px-2 xs:px-4 max-w-[200px] xs:max-w-[280px] sm:max-w-[400px] align-middle">
        <span
          className="block text-xs text-[var(--color-text-primary)] whitespace-pre-line"
          title={listing.title ?? ''}
          style={{
            wordBreak: 'break-word',
            whiteSpace: 'pre-line',
            lineHeight: '1.2',
          }}
        >
          {listing.title}
        </span>
      </td>
      <td className="py-1 px-2 align-middle">
        <Input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="h-8 w-16 sm:w-20 md:w-24 text-xs"
        />
      </td>
      {/* Discount controls */}
      <td className="py-1 px-2 align-middle">
        <div className="flex items-center gap-1">
          <Input type="number" placeholder="Alennus €" value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} className="h-8 w-20 text-xs" />
          <Input type="datetime-local" placeholder="Alkaa" value={discountStart} onChange={(e) => setDiscountStart(e.target.value)} className="h-8 w-44 text-xs" />
          <Input type="datetime-local" placeholder="Päättyy" value={discountEnd} onChange={(e) => setDiscountEnd(e.target.value)} className="h-8 w-44 text-xs" />
        </div>
      </td>
      <td className="py-1 px-2 align-middle">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-8 w-20 sm:w-28 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">Aktiivinen</SelectItem>
            <SelectItem value="ARCHIVED">Arkistoitu</SelectItem>
            <SelectItem value="SOLD">Myyty</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="py-6 px-2 align-middle">
        <div className="flex gap-1 flex-col xs:flex-row">
          <Button
            size="sm"
            className="w-full xs:w-auto px-2 py-1 text-xs"
            onClick={() => {
              const numeric = Number(price);
              const disc = Number(discountAmount);
              const payload: { companyListingId: string; status: any; basePrice?: number; discountAmount?: number; discountStart?: string; discountEnd?: string } = {
                companyListingId: listing.id,
                status,
                ...(price !== '' && Number.isFinite(numeric) ? { basePrice: numeric } : {}),
                ...(discountAmount !== '' && Number.isFinite(disc) && disc >= 0 ? { discountAmount: disc } : {}),
                ...(discountStart ? { discountStart } : {}),
                ...(discountEnd ? { discountEnd } : {}),
              };
              onSave(payload);
            }}
          >
            Tallenna
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-full xs:w-auto px-2 py-1 text-xs"
            onClick={() => {
              window.location.href = `/admin/listings/${listing.id}`;
            }}
          >
            Muokkaa
          </Button>
        </div>
      </td>
    </>
  );
}