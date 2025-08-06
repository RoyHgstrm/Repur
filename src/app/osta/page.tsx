'use client';

import Link from 'next/link';
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
import { Search, Zap, Shield, Truck, Star, Filter, SortAsc, Heart, Eye } from 'lucide-react';

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
        description: `Tietokone on ostettu hintaan ${purchase.purchasePrice ?? 0} €`,
        variant: "success"
      });
      setSelectedListing(null);
      setPurchaseDetails({
        paymentMethod: '',
        shippingAddress: '',
      });
    },
    onError: (error) => {
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
    ?.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return (a.basePrice ?? 0) - (b.basePrice ?? 0);
        case 'price-high':
          return (b.basePrice ?? 0) - (a.basePrice ?? 0);
        case 'newest':
          return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
        case 'rating':
          // Assuming rating logic exists, fallback to price for now
          return (b.basePrice ?? 0) - (a.basePrice ?? 0);
        default:
          return 0;
      }
    });

  const getConditionColor = (condition: string | null) => {
    switch (condition) {
      case 'Uusi': return 'bg-gradient-to-r from-emerald-500 to-green-400 text-white shadow-lg shadow-emerald-500/25';
      case 'Kuin uusi': return 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/25';
      case 'Hyvä': return 'bg-gradient-to-r from-yellow-500 to-orange-400 text-white shadow-lg shadow-yellow-500/25';
      case 'Tyydyttävä': return 'bg-gradient-to-r from-red-500 to-pink-400 text-white shadow-lg shadow-red-500/25';
      default: return 'bg-gradient-to-r from-gray-500 to-slate-400 text-white shadow-lg shadow-gray-500/25';
    }
  };

  const getPerformanceIcon = (gpu: string | null) => {
    const gpuLower = (gpu ?? '').toLowerCase();
    if (gpuLower.includes('rtx 40') || gpuLower.includes('rx 7')) return '🚀';
    if (gpuLower.includes('rtx 30') || gpuLower.includes('rx 6')) return '⚡';
    if (gpuLower.includes('gtx') || gpuLower.includes('rx 5')) return '💪';
    return '🎮';
  };

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
            {filteredAndSortedListings?.map((listing: ActiveListing, index) => (
              <div key={listing.id ?? ''} className="group relative">
                {/* Performance Badge */}
                <div className="absolute -top-2 -right-2 z-10">
                  <div className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-primary)] text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                    <span>{getPerformanceIcon(listing.gpu)}</span>
                    <span>#{index + 1}</span>
                  </div>
                </div>

                <Link href={`/osta/${listing.id}`} className="block">
                  <Card className="h-full flex flex-col bg-gradient-to-br from-surface-2 to-surface-3 border-[var(--color-border-light)] hover:border-[var(--color-primary)]/50 shadow-lg hover:shadow-2xl hover:shadow-[var(--color-primary)]/10 transition-all duration-500 group-hover:-translate-y-2 overflow-hidden">
                    {/* Card Header */}
                    <CardHeader className="pb-3 space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-lg-fluid font-bold text-primary group-hover:text-gradient-primary transition-all line-clamp-2 leading-tight">
                          {listing.title ?? 'Nimetön tietokone'}
                        </CardTitle>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="shrink-0 p-2 h-auto text-tertiary hover:text-accent-coral hover:bg-[var(--color-accent)]/10 transition-all"
                          onClick={(e) => {
                            e.preventDefault();
                            // Add to favorites logic here
                            toast({
                              title: "💖 Lisätty suosikkeihin",
                              description: "Tietokone lisätty suosikkilistaan",
                            });
                          }}
                        >
                          <Heart className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex justify-between items-center">
                        <Badge className={cn("text-xs font-semibold px-3 py-1", getConditionColor(listing.condition))}>
                          {listing.condition ?? 'Tuntematon kunto'}
                        </Badge>
                        <div className="text-right">
                          <div className="text-2xl-fluid font-black bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
                            {listing.basePrice ?? 0} €
                          </div>
                          <div className="text-xs text-tertiary">sis. alv</div>
                        </div>
                      </div>
                    </CardHeader>

                    {/* Card Content */}
                    <CardContent className="flex-grow space-y-3 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-2 bg-surface-1 rounded-lg">
                          <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full"></div>
                          <span className="text-secondary font-medium">CPU:</span>
                          <span className="text-primary font-semibold truncate">{listing.cpu ?? 'Ei tietoa'}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 p-2 bg-surface-1 rounded-lg">
                          <div className="w-2 h-2 bg-[var(--color-secondary)] rounded-full"></div>
                          <span className="text-secondary font-medium">GPU:</span>
                          <span className="text-primary font-semibold truncate">{listing.gpu ?? 'Ei tietoa'}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-1 p-1.5 bg-surface-1/50 rounded text-xs">
                            <span className="text-tertiary">RAM:</span>
                            <span className="text-primary font-medium">{listing.ram ?? 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-1 p-1.5 bg-surface-1/50 rounded text-xs">
                            <span className="text-tertiary">SSD:</span>
                            <span className="text-primary font-medium">{listing.storage ?? 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>

                    {/* Card Actions */}
                    <div className="p-4 pt-0 space-y-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-[var(--color-border-light)] text-secondary hover:bg-[var(--color-primary)]/10 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all"
                          onClick={(e) => {
                            e.preventDefault();
                            // Quick view logic
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Katso
                        </Button>
                        <Button 
                          className="flex-1 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] hover:from-[var(--color-primary)]/90 hover:to-[var(--color-accent)]/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedListing(listing);
                          }}
                        >
                          <Zap className="w-4 h-4 mr-1" />
                          Osta Nyt
                        </Button>
                      </div>
                      
                      {/* Trust indicators */}
                      <div className="flex justify-center gap-4 text-xs text-tertiary pt-1">
                        <span className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          Takuu
                        </span>
                        <span className="flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                          Ilmainen
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Purchase Dialog */}
      <Dialog open={selectedListing !== null} onOpenChange={() => setSelectedListing(null)}>
        <DialogContent className="max-w-md bg-gradient-to-br from-surface-2 to-surface-3 text-primary border-[var(--color-border-light)] shadow-2xl">
          <DialogHeader className="space-y-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] rounded-full mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <DialogTitle className="text-2xl-fluid font-bold text-gradient-primary">
                Osta {selectedListing?.title ?? 'tietokone'}
              </DialogTitle>
              <p className="text-secondary mt-2">Täytä ostotiedot ja saat koneesi nopeasti!</p>
            </div>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Price Summary */}
            <div className="p-4 bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 rounded-lg border border-[var(--color-primary)]/20">
              <div className="flex justify-between items-center">
                <span className="text-secondary">Kokonaishinta:</span>
                <span className="text-3xl-fluid font-black text-gradient-primary">
                  {selectedListing?.basePrice ?? 0} €
                </span>
              </div>
              <p className="text-xs text-tertiary mt-1">Sisältää alv:n ja ilmaisen toimituksen</p>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label className="text-secondary font-medium flex items-center gap-2">
                💳 Maksutapa
              </Label>
              <Select 
                value={purchaseDetails.paymentMethod}
                onValueChange={(value) => setPurchaseDetails(prev => ({
                  ...prev,
                  paymentMethod: value
                }))}
              >
                <SelectTrigger className="h-12 bg-surface-1 border-[var(--color-border-light)] text-primary">
                  <SelectValue placeholder="Valitse maksutapa" />
                </SelectTrigger>
                <SelectContent className="bg-surface-2 border-[var(--color-border-light)]">
                  <SelectItem value="kortti">💳 Korttimaksu</SelectItem>
                  <SelectItem value="lasku">📄 Lasku (14 pv)</SelectItem>
                  <SelectItem value="verkkopankki">🏦 Verkkopankki</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Shipping Address */}
            <div className="space-y-2">
              <Label className="text-secondary font-medium flex items-center gap-2">
                🚚 Toimitusosoite
              </Label>
              <Input 
                placeholder="Katu, postinumero, kaupunki" 
                value={purchaseDetails.shippingAddress}
                onChange={(e) => setPurchaseDetails(prev => ({
                  ...prev,
                  shippingAddress: e.target.value
                }))}
                className="h-12 bg-surface-1 border-[var(--color-border-light)] text-primary placeholder:text-tertiary focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
              />
            </div>

            {/* Purchase Button */}
            <Button 
              className="w-full h-12 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] hover:from-[var(--color-primary)]/90 hover:to-[var(--color-accent)]/90 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              onClick={handlePurchase}
              disabled={!purchaseDetails.paymentMethod || !purchaseDetails.shippingAddress || purchaseMutation.status === 'pending'}
            >
              {purchaseMutation.status === 'pending' ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Käsitellään...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Vahvista Osto {selectedListing?.basePrice ?? 0} €
                </div>
              )}
            </Button>

            {/* Security Notice */}
            <div className="text-center text-xs text-tertiary">
              <Shield className="w-4 h-4 inline mr-1" />
              Turvallinen maksu SSL-salauksella
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}