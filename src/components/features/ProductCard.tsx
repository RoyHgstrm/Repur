import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import Image from "next/image";
import { cn } from "~/lib/utils";
import { type RouterOutputs } from "~/trpc/react";
import { Heart, Eye, Zap, Shield, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

type ListingWithSeller = RouterOutputs['listings']['getActiveCompanyListings'][number];

interface ProductCardProps {
  listing: ListingWithSeller;
  onPurchaseClick: (listing: ListingWithSeller) => void;
}

export const ProductCard = ({ listing, onPurchaseClick }: ProductCardProps) => {
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
    <div className="group relative">
      {/* Performance Badge */}
      <div className="absolute -top-2 -right-2 z-10">
        <div className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-primary)] text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
          <span>{getPerformanceIcon(listing.gpu)}</span>
          <span>#1</span>{/* Placeholder, actual index comes from map in parent */}
        </div>
      </div>

      <Link href={`/osta/${listing.id}`} className="block">
        <Card className="h-full flex flex-col bg-gradient-to-br from-surface-2 to-surface-3 border-[var(--color-border-light)] hover:border-[var(--color-primary)]/50 shadow-lg hover:shadow-2xl hover:shadow-[var(--color-primary)]/10 transition-all duration-500 group-hover:-translate-y-2 overflow-hidden">
          {/* Image Display or Placeholder */}
          <div className="relative w-full aspect-video rounded-t-xl overflow-hidden mb-4 border-b border-[var(--color-border)]">
            {listing.images && listing.images.length > 0 ? (
              <Image
                src={listing.images[0]}
                alt={listing.title || "Product image"}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-[var(--color-surface-3)] flex items-center justify-center">
                <div className="flex flex-col items-center justify-center text-[var(--color-neutral)]/50">
                  <span className="text-5xl font-extrabold italic bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">R</span>
                  <span className="text-sm mt-1">Ei kuvaa</span>
                </div>
              </div>
            )}
          </div>

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
                  // This toast will need to be imported from use-toast
                  // toast({
                  //   title: "💖 Lisätty suosikkeihin",
                  //   description: "Tietokone lisätty suosikkilistaan",
                  // });
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
                  onPurchaseClick(listing);
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
  );
};