import React from "react";
import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import Image from "next/image";
import { cn } from "~/lib/utils";
import { type RouterOutputs } from "~/trpc/react";
import { Heart, Eye, Zap, Shield, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import EnhancedPurchaseDialog from "~/components/features/EnhancedPurchaseDialog";
import { Progress } from "~/components/ui/progress";

type ListingWithSeller = RouterOutputs['listings']['getActiveCompanyListings'][number];

interface ProductCardProps {
  listing: ListingWithSeller;
  onPurchaseClick: (listing: ListingWithSeller) => void;
}

export const ProductCard = ({ listing, onPurchaseClick }: ProductCardProps) => {
  // Remove palette/backdrop for simpler, faster rendering

  const withAlpha = (rgb: string, alpha: number) => (
    rgb?.startsWith('rgb(')
      ? rgb.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`)
      : `rgba(100, 100, 100, ${alpha})`
  );

  const getConditionColor = (condition: string | null) => {
    switch (condition) {
      case 'Uusi': 
        return 'bg-gradient-to-r from-emerald-500 to-green-400 text-white shadow-lg shadow-emerald-500/25 border-0';
      case 'Kuin uusi': 
        return 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/25 border-0';
      case 'Hyvä': 
        return 'bg-gradient-to-r from-yellow-500 to-orange-400 text-white shadow-lg shadow-yellow-500/25 border-0';
      case 'Tyydyttävä': 
        return 'bg-gradient-to-r from-red-500 to-pink-400 text-white shadow-lg shadow-red-500/25 border-0';
      default: 
        return 'bg-gradient-to-r from-gray-500 to-slate-400 text-white shadow-lg shadow-gray-500/25 border-0';
    }
  };

  const getPerformanceIcon = (gpu: string | null) => {
    const gpuLower = (gpu ?? '').toLowerCase();
    if (gpuLower.includes('rtx 40') || gpuLower.includes('rx 7')) return '🚀';
    if (gpuLower.includes('rtx 30') || gpuLower.includes('rx 6')) return '⚡';
    if (gpuLower.includes('gtx') || gpuLower.includes('rx 5')) return '💪';
    return '🎮';
  };

  // Simple performance score heuristic based on GPU/CPU strings (0-100)
  const computePerformanceScore = (gpu: string | null, cpu: string | null): number => {
    const g = (gpu ?? '').toLowerCase();
    const c = (cpu ?? '').toLowerCase();
    let score = 40; // base
    if (/rtx\s*4090|rtx\s*4080|rx\s*7900/.test(g)) score += 45;
    else if (/rtx\s*4070|rtx\s*3090|rx\s*6800/.test(g)) score += 35;
    else if (/rtx\s*3060|rtx\s*2080|rx\s*6700|gtx\s*1080/.test(g)) score += 25;
    else if (/gtx\s*1660|rx\s*580/.test(g)) score += 15;

    if (/i9|ryzen\s*9/.test(c)) score += 15;
    else if (/i7|ryzen\s*7/.test(c)) score += 10;
    else if (/i5|ryzen\s*5/.test(c)) score += 6;

    return Math.max(0, Math.min(100, score));
  };

  const perfScore = computePerformanceScore(listing.gpu ?? null, listing.cpu ?? null);

  // Discount logic: compute active discounted price if within window
  const now = new Date();
  // Some deployments may not include discount fields in the response shape → feature-detect
  const discountAmountNum = ('discountAmount' in listing && (listing as any).discountAmount != null)
    ? Number((listing as any).discountAmount)
    : 0;
  const hasWindow = ('discountStart' in listing && 'discountEnd' in listing
    && (listing as any).discountStart && (listing as any).discountEnd)
    ? now >= new Date(String((listing as any).discountStart)) && now <= new Date(String((listing as any).discountEnd))
    : false;
  const basePriceNum = Number(listing.basePrice ?? 0);
  const finalPrice = hasWindow && discountAmountNum > 0
    ? Math.max(0, basePriceNum - discountAmountNum)
    : basePriceNum;



  return (
    <div className="group relative w-full">

      <Link href={`/osta/${listing.id}`} className="block w-full">
        <Card className="h-full flex flex-col bg-gradient-to-br from-surface-2 to-surface-3 border-[var(--color-border-light)] hover:border-[var(--color-primary)]/50 shadow-lg hover:shadow-2xl hover:shadow-[var(--color-primary)]/20 transition-all duration-700 ease-out group-hover:-translate-y-1 sm:group-hover:-translate-y-2 overflow-hidden backdrop-blur-sm">
          {hasWindow && discountAmountNum > 0 && (
            <div className="absolute top-3 right-3 z-10">
              <span className="discount-badge badge-spotlight" aria-label="Alennus voimassa">
                ✨ ALENNUS
              </span>
            </div>
          )}
          {/* Image - cover container, no backdrop */}
          <div
            className="
              relative w-full
              aspect-[4/3] sm:aspect-[16/9] md:aspect-[21/9] lg:aspect-[2/1]
              rounded-t-xl overflow-hidden mb-3 sm:mb-4
              border-b border-[var(--color-border)]/50
              "
            style={{ height: 'auto' }}
          >
            {listing.images && listing.images.length > 0 && listing.images[0] ? (
              <Image
                src={listing.images[0]}
                alt={listing.title || 'Product image'}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 80vw, (max-width: 1024px) 60vw, 50vw"
                className="object-contain"
                priority={false}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full min-h-[180px] flex items-center justify-center bg-gradient-to-br from-[var(--color-surface-3)] to-[var(--color-surface-2)] rounded-t-xl">
                <div className="flex flex-col items-center justify-center text-[var(--color-neutral)]/60">
                  <div className="relative">
                    <span className="text-4xl sm:text-5xl md:text-6xl font-extrabold italic bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
                      R
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)]/20 to-[var(--color-accent)]/20 blur-xl scale-150" aria-hidden />
                  </div>
                  <span className="text-xs sm:text-sm mt-2 font-medium">Ei kuvaa</span>
                </div>
              </div>
            )}
          </div>

          {/* Card Header */}
          <CardHeader className="pb-3 px-3 sm:px-4 md:px-6 space-y-3">
            <div className="flex justify-between items-start gap-2">
              <CardTitle className="text-base sm:text-lg md:text-xl font-bold text-primary group-hover:text-gradient-primary transition-all line-clamp-2 leading-tight flex-1">
                {listing.title ?? 'Nimetön tietokone'}
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                className="shrink-0 p-2 h-auto text-tertiary hover:text-accent-coral hover:bg-[var(--color-accent)]/10 transition-all rounded-full"
                onClick={(e) => {
                  e.preventDefault();
                  // Add to favorites logic here
                }}
              >
                <Heart className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <Badge className={cn("text-xs font-semibold px-3 py-1.5 rounded-full", getConditionColor(listing.condition))}>
                {listing.condition ?? 'Tuntematon kunto'}
              </Badge>
              <div className="text-right sm:text-right">
                {hasWindow && discountAmountNum > 0 ? (
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2">
                      <span className="badge-spotlight animate-pulse-soft inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/40 text-[var(--color-accent)] text-xs font-semibold">
                        ✨ Alennus
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 justify-end">
                      <span className="text-sm text-tertiary line-through">{basePriceNum} €</span>
                      <span className="glow-accent-hover text-xl sm:text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-accent)] to-[var(--color-primary)] bg-clip-text text-transparent">
                        {finalPrice} €
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xl sm:text-2xl md:text-3xl font-black bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
                    {basePriceNum} €
                  </div>
                )}
                <div className="text-xs text-tertiary">sis. alv</div>
              </div>
            </div>
          </CardHeader>

          {/* Card Content - Improved responsive grid */}
          <CardContent className="flex-grow space-y-3 text-sm px-3 sm:px-4 md:px-6">
            {/* Performance rating row */}
            <div className="flex items-center gap-3">
              <div className="min-w-[100px] text-xs text-tertiary">Suorituskyky</div>
              <Progress value={perfScore} className="h-2 flex-1" />
              <div className="text-xs font-semibold text-primary w-10 text-right">{perfScore}</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-surface-1 rounded-xl transition-colors hover:bg-surface-1/80">
                <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full flex-shrink-0"></div>
                <span className="text-secondary font-medium min-w-0">CPU:</span>
                <span className="text-primary font-semibold truncate flex-1">{listing.cpu ?? 'Ei tietoa'}</span>
              </div>
              
              <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-surface-1 rounded-xl transition-colors hover:bg-surface-1/80">
                <div className="w-2 h-2 bg-[var(--color-secondary)] rounded-full flex-shrink-0"></div>
                <span className="text-secondary font-medium min-w-0">GPU:</span>
                <span className="text-primary font-semibold truncate flex-1">{listing.gpu ?? 'Ei tietoa'}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5 p-2 bg-surface-1/60 rounded-lg text-xs transition-colors hover:bg-surface-1/80">
                  <span className="text-tertiary whitespace-nowrap">RAM:</span>
                  <span className="text-primary font-medium truncate">{listing.ram ?? 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 bg-surface-1/60 rounded-lg text-xs transition-colors hover:bg-surface-1/80">
                  <span className="text-tertiary whitespace-nowrap">SSD:</span>
                  <span className="text-primary font-medium truncate">{listing.storage ?? 'N/A'}</span>
                </div>
              </div>
            </div>
          </CardContent>

          {/* Card Actions - Enhanced responsive buttons */}
          <div className="p-3 sm:p-4 md:p-6 pt-0 space-y-3">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-[var(--color-border-light)] text-secondary hover:bg-[var(--color-primary)]/10 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all duration-300 rounded-lg"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = `/osta/${listing.id}`;
                }}
              >
                <Eye className="w-4 h-4 mr-1.5" />
                <span className="hidden sm:inline">Katso</span>
                <span className="sm:hidden">👁️</span>
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] hover:from-[var(--color-primary)]/90 hover:to-[var(--color-accent)]/90 text-white font-semibold shadow-lg hover:shadow-xl hover:shadow-[var(--color-primary)]/25 transition-all duration-300 rounded-lg"
                onClick={(e) => {
                  e.preventDefault();
                  onPurchaseClick(listing);
                }}
              >
                <Zap className="w-4 h-4 mr-1.5" />
                {/* Enhanced Purchase Dialog */}
                <EnhancedPurchaseDialog
                  trigger={<span className="hidden sm:inline">Osta Nyt</span>}
                  productTitle={listing.title}
                  priceEUR={finalPrice}
                  onConfirm={() => {
                    // navigate to checkout
                  }}
                  confirmLabel="Siirry kassalle"
                  cancelLabel="Sulje"
                />
                <span className="sm:hidden">Osta</span>
              </Button>
            </div>
            
            {/* Trust indicators - Enhanced responsive design */}
            <div className="flex justify-center gap-3 sm:gap-4 text-xs text-tertiary pt-1">
              <span className="flex items-center gap-1 transition-colors hover:text-secondary">
                <Shield className="w-3 h-3" />
                <span className="hidden sm:inline">Takuu</span>
              </span>
              <span className="flex items-center gap-1 transition-colors hover:text-secondary">
                <Truck className="w-3 h-3" />
                <span className="hidden sm:inline">Ilmainen</span>
              </span>
            </div>
          </div>
        </Card>
      </Link>
    </div>
  );
};