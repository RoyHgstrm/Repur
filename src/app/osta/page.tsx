'use client';

import Link from 'next/link'; // Corrected Link import
import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Badge } from '~/components/ui/badge';
import { api } from '~/trpc/react';
import { toast } from '~/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Label } from '~/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { cn } from '~/lib/utils';
import { type RouterOutputs } from '~/trpc/react';

export default function OstaPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedListing, setSelectedListing] = useState<ActiveListing | null>(null);
  const [purchaseDetails, setPurchaseDetails] = useState({
    paymentMethod: '',
    shippingAddress: '',
  });

  // Fetch active listings
  const { data: listings, isLoading } = api.listings.getActiveCompanyListings.useQuery();

  // Add type for listing
  type ActiveListing = RouterOutputs['listings']['getActiveCompanyListings'][number];

  // Purchase mutation
  const purchaseMutation = api.listings.createPurchase.useMutation({
    onSuccess: (purchase) => {
      toast({
        title: "Osto onnistui",
        description: `Tietokone on ostettu hintaan ${purchase.purchasePrice ?? 0} €`,
        variant: "success"
      });
      // Close dialog and reset state
      setSelectedListing(null);
      setPurchaseDetails({
        paymentMethod: '',
        shippingAddress: '',
      });
    },
    onError: (error) => {
      toast({
        title: "Virhe",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handlePurchase = () => {
    if (selectedListing && purchaseDetails.paymentMethod && purchaseDetails.shippingAddress) {
      purchaseMutation.mutate({
        companyListingId: selectedListing.id,
        paymentMethod: purchaseDetails.paymentMethod,
        shippingAddress: purchaseDetails.shippingAddress,
      });
    } else {
      toast({
        title: "Puutteelliset tiedot",
        description: "Täytä kaikki ostotiedot",
        variant: "destructive"
      });
    }
  };

  // Filter listings based on search term
  const filteredListings = listings?.filter((listing: ActiveListing) =>
    (listing.title ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (listing.cpu ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (listing.gpu ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-container py-section">
      <h1 className="text-3xl-fluid font-bold mb-8 text-center text-[var(--color-neutral)]">Osta Kunnostettu Pelitietokone</h1>
      
      <div className="mb-8 max-w-lg mx-auto">
        <Input 
          placeholder="Etsi tietokoneita (prosessori, näytönohjain, otsikko)" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-neutral)] placeholder-[var(--color-neutral)]/50 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
        />
      </div>

      {isLoading ? (
        <p className="text-center text-[var(--color-neutral)]/80 text-lg-fluid">Ladataan listauksia...</p>
      ) : filteredListings?.length === 0 ? (
        <p className="text-center text-[var(--color-neutral)]/80 text-lg-fluid">Ei löytynyt yhtään listattua tietokonetta</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredListings?.map((listing: ActiveListing) => (
            <Link key={listing.id ?? ''} href={`/osta/${listing.id}`} className="block group">
              <Card className="bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-neutral)] shadow-sm hover:shadow-lg transition-all duration-300 dark:bg-[var(--color-surface-2)]/50 dark:border-[var(--color-border)] dark:text-[var(--color-neutral)] h-full flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl-fluid font-semibold text-[var(--color-neutral)] group-hover:text-[var(--color-primary)] transition-colors line-clamp-1">{listing.title ?? ''}</CardTitle>
                  <div className="flex justify-between items-center mt-2">
                    <Badge className={cn(
                      "text-sm px-2.5 py-0.5 rounded-full",
                      listing.condition === 'Uusi' && "bg-[var(--color-success)] text-white",
                      listing.condition === 'Kuin uusi' && "bg-[var(--color-success)]/80 text-white",
                      listing.condition === 'Hyvä' && "bg-[var(--color-warning)] text-white",
                      listing.condition === 'Tyydyttävä' && "bg-[var(--color-error)] text-white",
                      !listing.condition && "bg-[var(--color-neutral)]/50 text-white"
                    )}>
                      {listing.condition ?? 'Tuntematon kunto'}
                    </Badge>
                    <span className="font-bold text-2xl-fluid text-[var(--color-primary)]">{listing.basePrice ?? 0} €</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow space-y-2 text-[var(--color-neutral)]/80 text-sm">
                  <p className="line-clamp-1"><strong>Prosessori:</strong> {listing.cpu ?? 'Ei tietoa'}</p>
                  <p className="line-clamp-1"><strong>Näytönohjain:</strong> {listing.gpu ?? 'Ei tietoa'}</p>
                  <p className="line-clamp-1"><strong>RAM:</strong> {listing.ram ?? 'Ei tietoa'}</p>
                  <p className="line-clamp-1"><strong>Tallennustila:</strong> {listing.storage ?? 'Ei tietoa'}</p>
                </CardContent>
                {/* The purchase dialog trigger is now inside the Link component, it will not navigate immediately. 
                    A separate purchase flow on the detail page or a modal on this page (without navigating) would be better. */}
                <div className="p-4 pt-0">
                  <Button 
                    className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white"
                    onClick={(e) => {
                      e.preventDefault(); // Prevent navigation to show dialog instead
                      setSelectedListing(listing);
                    }}
                  >
                    Osta Nyt
                  </Button>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Purchase Dialog remains as a modal for quick purchase from listing page */}
      <Dialog open={selectedListing !== null} onOpenChange={() => setSelectedListing(null)}>
        <DialogContent className="bg-[var(--color-surface-2)] text-[var(--color-neutral)] border-[var(--color-border)]">
          <DialogHeader>
            <DialogTitle className="text-2xl-fluid font-bold">Osta {selectedListing?.title ?? 'tietokone'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div>
              <Label htmlFor="paymentMethod" className="text-[var(--color-neutral)]/80">Maksutapa</Label>
              <Select 
                value={purchaseDetails.paymentMethod}
                onValueChange={(value) => setPurchaseDetails(prev => ({
                  ...prev,
                  paymentMethod: value
                }))}
              >
                <SelectTrigger className="bg-[var(--color-surface-3)] border-[var(--color-border)] text-[var(--color-neutral)] data-[placeholder]:text-[var(--color-neutral)]/50">
                  <SelectValue placeholder="Valitse maksutapa" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--color-surface-3)] border-[var(--color-border)] text-[var(--color-neutral)]">
                  <SelectItem value="kortti">Korttimaksu</SelectItem>
                  <SelectItem value="lasku">Lasku</SelectItem>
                  <SelectItem value="verkkopankki">Verkkopankki</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="shippingAddress" className="text-[var(--color-neutral)]/80">Toimitusosoite</Label>
              <Input 
                id="shippingAddress"
                placeholder="Syötä toimitusosoite" 
                value={purchaseDetails.shippingAddress}
                onChange={(e) => setPurchaseDetails(prev => ({
                  ...prev,
                  shippingAddress: e.target.value
                }))}
                className="bg-[var(--color-surface-3)] border-[var(--color-border)] text-[var(--color-neutral)] placeholder-[var(--color-neutral)]/50 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
              />
            </div>
            <Button 
              className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white"
              onClick={handlePurchase}
              disabled={!purchaseDetails.paymentMethod || !purchaseDetails.shippingAddress || purchaseMutation.status === 'pending'}
            >
              {purchaseMutation.status === 'pending' ? "Käsitellään..." : `Vahvista Osto ${selectedListing?.basePrice ?? 0} €`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}