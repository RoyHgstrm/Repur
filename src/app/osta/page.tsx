'use client';

import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { toast } from '~/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Label } from '~/components/ui/label';
// import { cn } from '~/lib/utils';
import { type RouterOutputs } from '~/trpc/react';
import { Search, Zap, Shield, Truck, Star, Filter, SortAsc } from 'lucide-react';
import { ProductCard } from "~/components/features/ProductCard";
import { api } from '~/trpc/react';
import EnhancedPurchaseDialog from "~/components/features/EnhancedPurchaseDialog";

export default function OstaPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedListing, setSelectedListing] = useState<ActiveListing | null>(null);
  const [sortBy, setSortBy] = useState<'price-low' | 'price-high' | 'newest' | 'rating'>('newest');
  const [filterCondition, setFilterCondition] = useState<string>('all');
  const [purchaseDetails, setPurchaseDetails] = useState({
    paymentMethod: '',
    shippingAddress: '',
  });

  // Fetch active listings
  const { data: listings, isLoading } = api.listings.getActiveCompanyListings.useQuery();

  type ActiveListing = RouterOutputs['listings']['getActiveCompanyListings'][number];

  // Purchase mutation
  const purchaseMutation = api.listings.createPurchase.useMutation({
    onSuccess: (purchase) => {
      toast({
        title: "🎉 Osto onnistui!",
        description: `Tietokone on ostettu hintaan ${parseFloat(purchase.purchasePrice) ?? 0} €`,
        variant: "success"
      });
      setSelectedListing(null);
      setPurchaseDetails({
        paymentMethod: '',
        shippingAddress: '',
      });
    },
    onError: (error: { message: string }) => {
      toast({
        title: "❌ Virhe",
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
        title: "⚠️ Puutteelliset tiedot",
        description: "Täytä kaikki ostotiedot",
        variant: "destructive"
      });
    }
  };

  // Filter and sort listings
  const filteredAndSortedListings = listings
    ?.filter((listing: ActiveListing) => {
      const matchesSearch =
        (listing.title ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (listing.cpu ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (listing.gpu ?? '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterCondition === 'all' || listing.condition === filterCondition;
      
      return matchesSearch && matchesFilter;
    })
    ?.sort((a: ActiveListing, b: ActiveListing) => {
      switch (sortBy) {
        case 'price-low':
          return (Number(a.basePrice) ?? 0) - (Number(b.basePrice) ?? 0);
        case 'price-high':
          return (Number(b.basePrice) ?? 0) - (Number(a.basePrice) ?? 0);
        case 'newest':
          return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
        case 'rating':
          // Assuming rating logic exists, fallback to price for now
          return (Number(b.basePrice) ?? 0) - (Number(a.basePrice) ?? 0);
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-surface-1)] via-[var(--color-surface-2)] to-[var(--color-surface-1)]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)]/10 via-[var(--color-secondary)]/10 to-[var(--color-accent)]/10" />
        <div className="container-responsive py-section relative">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] p-1 rounded-full">
              <span className="bg-white text-[var(--color-primary)] px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Premium Pelitietokoneet
              </span>
            </div>
            
            <h1 className="text-gradient-primary text-4xl-fluid md:text-5xl-fluid font-black leading-tight">
              Osta Kunnostettu 
              <br />
              <span className="text-gradient-accent">Pelitietokone</span>
            </h1>
            
            <p className="text-secondary text-lg-fluid max-w-2xl mx-auto">
              Löydä täydellinen pelitietokone laajasta valikoimastamme. Kaikki koneet on huolellisesti kunnostettu ja testattu.
            </p>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-6 mt-8">
              <div className="flex items-center gap-2 text-accent-secondary">
                <Shield className="w-5 h-5" />
                <span className="text-sm font-medium">12kk Takuu</span>
              </div>
              <div className="flex items-center gap-2 text-accent-primary">
                <Truck className="w-5 h-5" />
                <span className="text-sm font-medium">Ilmainen Toimitus</span>
              </div>
              <div className="flex items-center gap-2 text-accent-coral">
                <Star className="w-5 h-5 fill-current" />
                <span className="text-sm font-medium">4.8/5 Tähteä</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full py-8 mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
        {/* Search and Filter Section */}
        <div className="card-responsive mb-8 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
            {/* Search */}
            <div className="space-y-2">
              <Label className="text-secondary font-medium">Etsi tietokonetta</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-tertiary" />
                <Input 
                  placeholder="Prosessori, näytönohjain, malli..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 bg-surface-3 border-[var(--color-border-light)] text-primary placeholder:text-tertiary focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all"
                />
              </div>
            </div>

            {/* Filter */}
            <div className="space-y-2">
              <Label className="text-secondary font-medium">Kunto</Label>
              <Select value={filterCondition} onValueChange={setFilterCondition}>
                <SelectTrigger className="h-12 bg-surface-3 border-[var(--color-border-light)] text-primary">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    <SelectValue placeholder="Kaikki kunnot" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-surface-2 border-[var(--color-border-light)]">
                  <SelectItem value="all">Kaikki kunnot</SelectItem>
                  <SelectItem value="Uusi">Uusi</SelectItem>
                  <SelectItem value="Kuin uusi">Kuin uusi</SelectItem>
                  <SelectItem value="Hyvä">Hyvä</SelectItem>
                  <SelectItem value="Tyydyttävä">Tyydyttävä</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className="space-y-2">
              <Label className="text-secondary font-medium">Järjestä</Label>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="h-12 bg-surface-3 border-[var(--color-border-light)] text-primary">
                  <div className="flex items-center gap-2">
                    <SortAsc className="w-4 h-4" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-surface-2 border-[var(--color-border-light)]">
                  <SelectItem value="newest">Uusimmat ensin</SelectItem>
                  <SelectItem value="price-low">Halvin ensin</SelectItem>
                  <SelectItem value="price-high">Kallin ensin</SelectItem>
                  <SelectItem value="rating">Parhaiten arvioitu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
            <p className="text-secondary text-sm">
              {isLoading ? 'Ladataan...' : `${filteredAndSortedListings?.length ?? 0} tietokonetta löytyi`}
            </p>
          </div>
        </div>

        {/* Listings Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-primary)] border-t-transparent"></div>
            <p className="text-secondary text-lg-fluid">Ladataan huippukoneita...</p>
          </div>
        ) : filteredAndSortedListings?.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="text-6xl">🔍</div>
            <h3 className="text-2xl-fluid font-bold text-primary">Ei hakutuloksia</h3>
            <p className="text-secondary text-lg-fluid max-w-md mx-auto">
              Kokeile eri hakusanoja tai muuta suodattimia löytääksesi täydellisen pelitietokoneen.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedListings?.map((listing: ActiveListing, _index) => (
              <ProductCard key={listing.id ?? ''} listing={listing} onPurchaseClick={setSelectedListing} />
            ))}
          </div>
        )}
      </div>


    </div>
  );
}