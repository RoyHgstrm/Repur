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
import { useRef } from 'react';

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
      <h1 className="text-3xl-fluid sm:text-4xl-fluid lg:text-5xl-fluid font-bold mb-8 text-center text-[var(--color-neutral)]">
        Ylläpitäjän Hallintapaneeli
      </h1>

      <Tabs defaultValue="companyListings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="companyListings">Yrityksen Listaukset</TabsTrigger>
          <TabsTrigger value="tradeIns">Trade-In Pyynnöt</TabsTrigger>
        </TabsList>

        <TabsContent value="companyListings">
          <CompanyListingForm />
        </TabsContent>

        <TabsContent value="tradeIns">
          <TradeInListingsTable />
        </TabsContent>
      </Tabs>
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
                  setSelectedImage((prev) => [...prev, ...files]);
                } else {
                  setSelectedImage([]);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }
              }}
              className="bg-[var(--color-surface-3)] border-[var(--color-border)] text-[var(--color-neutral)] placeholder-[var(--color-neutral)]/50 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] file:text-[var(--color-primary)] file:font-semibold"
            />
            {selectedImage.length > 0 && (
              <div className="mt-2 text-sm text-[var(--color-neutral)]/70">
                <p>Valitut tiedostot: {selectedImage.map(file => file.name).join(', ')}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
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
  const { data: tradeInListings, isLoading, refetch } = api.listings.getPendingTradeInListings.useQuery();
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
        <CardTitle className="text-2xl-fluid font-semibold">Odottaa Trade-In Pyynnöt</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center text-[var(--color-neutral)]/80">Ladataan trade-in pyyntöjä...</p>
        ) : tradeInListings?.length === 0 ? (
          <p className="text-center text-[var(--color-neutral)]/80">Ei odottavia trade-in pyyntöjä.</p>
        ) : (
          <div className="space-y-4">
            {tradeInListings?.map((listing: TradeInListing) => (
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
                {listing.estimatedValue && (
                  <p className="text-[var(--color-neutral)]/80 text-sm">
                    Arvioitu arvo: {
                      (() => {
                        const parsedValue = parseFloat(listing.estimatedValue);
                        return isNaN(parsedValue) ? "Ei tiedossa" : `${parsedValue.toFixed(2)} €`;
                      })()
                    }
                  </p>
                )}
                <p className="text-[var(--color-neutral)]/80 text-sm">Status: {listing.status === 'PENDING' ? 'Odottaa' : 'Käsitelty'}</p>
                <Button
                  className="mt-4 w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white"
                  onClick={() => handleContactUser(listing.id)}
                  disabled={markContactedMutation.status === 'pending'}
                >
                  Merkitse Käsiteltyksi
                </Button>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}