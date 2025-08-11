"use client"
import { api } from '~/trpc/react';
// import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { 
  Euro, 
  Cpu, 
  Gauge, 
  MemoryStick, 
  HardDrive, 
  Power, 
  Server, 
  Package, 
  Image as ImageIcon,
  ArrowLeft,
  Share2,
  Heart,
  Shield,
  Truck,
  Star,
  Clock,
  User,
  CheckCircle,
  Info,
  Zap,
  Gamepad2,
  ShieldCheck,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import Image from 'next/image';
import Link from 'next/link';
import { nanoid } from 'nanoid';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { type RouterOutputs } from '~/trpc/react';
import { cn } from '~/lib/utils';
// server-only types/imports removed to keep this a Client Component file
import CollapsibleComponent from '~/components/ui/CollapsibleComponent';
import { FPS_DATA } from '~/lib/fpsConstants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { api as trpc } from '~/trpc/react';
import EnhancedPurchaseDialog from "~/components/features/EnhancedPurchaseDialog";
import { getStripe } from "~/lib/stripe";
import { useMemo } from 'react';

type DetailedListing = RouterOutputs['listings']['getCompanyListingById'] & {
  seller?: { name: string | null; };
  evaluatedBy?: { name: string | null; };
};



export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { isSignedIn } = useAuth();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const favToggle = trpc.favorites.toggle.useMutation();
  const favState = trpc.favorites.isFavorited.useQuery({ listingId: id }, { enabled: !!id && Boolean(isSignedIn) });

  const { data: listingData, isLoading, error } = api.listings.getCompanyListingById.useQuery({ id });
  const [showPurchased, setShowPurchased] = useState(false);
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('maksu') === 'onnistui') {
      setShowPurchased(true);
      url.searchParams.delete('maksu');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, []);
  const createCheckout = api.payments.createCheckoutSession.useMutation();

  const listing = listingData as DetailedListing;
  // Ensure hooks are called before any early returns to keep hook order consistent
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [estimatedGameFps, setEstimatedGameFps] = useState(() => getEstimatedFps(3, null, null));

  // Removed backdrop/palette usage to keep images simple and cover the view
  // Lightbox state (declared but not used if not rendered)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const openModal = (index: number) => { setModalImageIndex(index); setIsModalOpen(true); };
  const closeModal = () => setIsModalOpen(false);
  const prevImage = () => setModalImageIndex((i) => (i - 1 + images.length) % images.length);
  const nextImage = () => setModalImageIndex((i) => (i + 1) % images.length);
  const [isZoomed, setIsZoomed] = useState(false);
  const downloadImage = async () => {
    try {
      const url = images[modalImageIndex];
      if (!url) return;
      const a = document.createElement('a');
      a.href = url; a.download = 'image.jpg'; a.click();
    } catch {}
  };
  const shareImage = async () => {
    try {
      const url = images[modalImageIndex];
      if (!url || !('share' in navigator)) return;
      await (navigator as any).share({ url });
    } catch {}
  };

  // Performance rating based on components
  const performance = listing ? getPerformanceRating(listing.gpu, listing.cpu) : { rating: 3, label: 'Perus' } as const;
  // Safe helpers for current image and list
  const images = Array.isArray(listing?.images) ? (listing!.images as string[]) : [];
  const currentImage = images[selectedImageIndex] || images[0];
  // Derived inputs for FPS calculation
  const gpuForCalc = listing?.gpu ?? null;
  const cpuForCalc = listing?.cpu ?? null;
  useEffect(() => {
    setEstimatedGameFps(getEstimatedFps(performance.rating, gpuForCalc, cpuForCalc));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [performance.rating, gpuForCalc, cpuForCalc]);

  function getPerformanceRating(gpu: string | null, cpu: string | null) {
    const gpuLower = (gpu ?? '').toLowerCase();
    const cpuLower = (cpu ?? '').toLowerCase();
    
    if (gpuLower.includes('rtx 40') || gpuLower.includes('rx 7') || 
        cpuLower.includes('i9') || cpuLower.includes('ryzen 9')) return { rating: 5, label: 'Huippusuoritus' };
    if (gpuLower.includes('rtx 30') || gpuLower.includes('rx 6') || 
        cpuLower.includes('i7') || cpuLower.includes('ryzen 7')) return { rating: 4, label: 'Erinomainen' };
    if (gpuLower.includes('gtx') || gpuLower.includes('rx 5') || 
        cpuLower.includes('i5') || cpuLower.includes('ryzen 5')) return { rating: 3, label: 'Hyvä' };
    return { rating: 2, label: 'Perus' };
  }

  // Returns two representative colors from an image URL for dynamic UI theming
  // (palette extraction removed)

  const getConditionColor = (condition: string | null) => {
    switch (condition) {
      case 'Uusi': return 'bg-gradient-to-r from-emerald-500 to-green-400 text-white';
      case 'Kuin uusi': return 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white';
      case 'Hyvä': return 'bg-gradient-to-r from-yellow-500 to-orange-400 text-white';
      case 'Tyydyttävä': return 'bg-gradient-to-r from-red-500 to-pink-400 text-white';
      default: return 'bg-gradient-to-r from-gray-500 to-slate-400 text-white';
    }
  };

  // Additional tuning multipliers to improve estimated FPS accuracy heuristically
  function getGpuTierMultiplier(gpu: string | null): number {
    const g = (gpu ?? "").toLowerCase();
    if (/rtx\s*4090|rtx\s*4080|rx\s*79\d{2}/.test(g)) return 1.35;
    if (/rtx\s*4070|rtx\s*4060|rx\s*77\d{2}|rx\s*76\d{2}/.test(g)) return 1.15;
    if (/rtx\s*3090|rtx\s*3080|rtx\s*3070|rx\s*69\d{2}|rx\s*68\d{2}|rx\s*67\d{2}/.test(g)) return 1.2;
    if (/rtx\s*3060|rtx\s*3050|rx\s*66\d{2}|rx\s*65\d{2}/.test(g)) return 1.05;
    if (/gtx\s*16|gtx\s*10|rx\s*5\d{2,3}/.test(g)) return 0.9;
    return 1.0;
  }

  function getCpuTierMultiplier(cpu: string | null): number {
    const c = (cpu ?? "").toLowerCase();
    if (/i9|ryzen\s*9/.test(c)) return 1.15;
    if (/i7|ryzen\s*7/.test(c)) return 1.08;
    if (/i5|ryzen\s*5/.test(c)) return 1.0;
    return 0.9;
  }

  // Simplified FPS estimation based on performance rating
  // HOW: This function estimates FPS for different games and settings based on the system's performance rating.
  // WHY: Provides users with a clear, relatable measure of a PC's gaming capability, enhancing transparency and user confidence, without requiring complex real-world benchmarks on every listing.
  function getEstimatedFps(rating: number, gpu: string | null, cpu: string | null) {
    const allFpsData: { game: string; resolution: string; quality: string; multiplier: number; }[] = [];

    for (const gameName in FPS_DATA.GAMES) {
      const gameData = FPS_DATA.GAMES[gameName as keyof typeof FPS_DATA.GAMES];
      for (const resolution in gameData) {
        const settingsData = gameData[resolution as keyof typeof gameData];
        for (const quality in settingsData) {
          allFpsData.push({
            game: gameName,
            resolution,
            quality,
            multiplier: settingsData[quality as keyof typeof settingsData],
          });
        }
      }
    }

    const estimatedFpsMap = new Map<string, Map<string, { quality: string; fps: number; }[]>>();

    allFpsData.forEach(({ game, resolution, quality, multiplier }) => {
      const perfBase = FPS_DATA.BASE_FPS + (rating - 3) * FPS_DATA.RATING_ADJUST;
      const tuning = Math.min(1.5, Math.max(0.75, getGpuTierMultiplier(gpu) * getCpuTierMultiplier(cpu)));
      const calculatedFps = Math.round(perfBase * multiplier * tuning);
      const fps = Math.max(1, calculatedFps);

      if (!estimatedFpsMap.has(game)) {
        estimatedFpsMap.set(game, new Map<string, { quality: string; fps: number; }[]>());
      }
      const gameMap = estimatedFpsMap.get(game)!;

      if (!gameMap.has(resolution)) {
        gameMap.set(resolution, []);
      }
      gameMap.get(resolution)!.push({ quality, fps });
    });

    const result: { game: string; resolutions: { resolution: string; settings: { quality: string; fps: number; }[]; }[]; }[] = [];
    estimatedFpsMap.forEach((resolutionsMap, game) => {
      const resolutions: { resolution: string; settings: { quality: string; fps: number; }[]; }[] = [];
      resolutionsMap.forEach((settings, resolution) => {
        resolutions.push({ resolution, settings });
      });
      result.push({ game, resolutions });
    });
    return result;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--color-surface-1)] via-[var(--color-surface-2)] to-[var(--color-surface-1)]">
        <div className="container-responsive py-8">
          {/* Loading skeleton */}
          <div className="animate-pulse space-y-6">
            {/* Header skeleton */}
            <div className="flex items-center gap-4 mb-6">
              <div className="h-10 w-10 bg-surface-3 rounded-full"></div>
              <div className="h-8 bg-surface-3 rounded w-32"></div>
            </div>
            
            {/* Main content skeleton */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Left column */}
              <div className="xl:col-span-2 space-y-6">
                <div className="aspect-video bg-surface-3 rounded-xl"></div>
                <div className="grid grid-cols-4 gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="aspect-square bg-surface-3 rounded-lg"></div>
                  ))}
                </div>
              </div>
              
              {/* Right column */}
              <div className="space-y-6">
                <div className="bg-surface-2 rounded-xl p-6 space-y-4">
                  <div className="h-8 bg-surface-3 rounded w-3/4"></div>
                  <div className="h-12 bg-surface-3 rounded w-1/2"></div>
                  <div className="h-10 bg-surface-3 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    if (error.data?.code === 'NOT_FOUND') {
      // Render a friendly not found view instead of using notFound() here to avoid conditional hooks issues
      return (
        <div className="min-h-screen bg-gradient-to-br from-[var(--color-surface-1)] via-[var(--color-surface-2)] to-[var(--color-surface-1)] flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-6xl">🕵️‍♂️</div>
            <h2 className="text-2xl-fluid font-bold text-primary">Listaus ei löytynyt</h2>
            <p className="text-secondary">Pyydettyä kohdetta ei ole tai se on poistettu.</p>
            <Button onClick={() => router.push('/osta')} variant="outline">
              Takaisin listaukseen
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--color-surface-1)] via-[var(--color-surface-2)] to-[var(--color-surface-1)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">⚠️</div>
          <h2 className="text-2xl-fluid font-bold text-primary">Virhe sivun lataamisessa</h2>
          <p className="text-secondary">{error.message}</p>
          <Button onClick={() => router.back()} variant="outline">
            Takaisin
          </Button>
        </div>
      </div>
    );
  }

  // (removed duplicate performance/effect block)
  const specs = [
    { label: "Prosessori", value: listing.cpu, Icon: Cpu, color: "text-[var(--color-primary)]" },
    { label: "Näytönohjain", value: listing.gpu, Icon: Gauge, color: "text-[var(--color-accent)]" },
    { label: "RAM", value: listing.ram, Icon: MemoryStick, color: "text-[var(--color-info)]" },
    { label: "Tallennustila", value: listing.storage, Icon: HardDrive, color: "text-[var(--color-success)]" },
    { label: "Emolevy", value: listing.motherboard, Icon: Server, color: "text-[var(--color-secondary)]" },
    { label: "Virtalähde", value: listing.powerSupply, Icon: Power, color: "text-[var(--color-warning)]" },
    { label: "Kotelo", value: listing.caseModel, Icon: Package, color: "text-[var(--color-tertiary)]" },
  ].filter(spec => spec.value);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-surface-1)] via-[var(--color-surface-2)] to-[var(--color-surface-1)]">
      {/* Navigation Header */}
      <div className=" top-0 z-999 top-16  backdrop-blur-lg border-b border-[var(--color-border)] pt-4">
        <div className="container-responsive py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="p-2 hover:bg-surface-2 rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="hidden sm:block">
                <Link href="/osta" className="text-secondary hover:text-primary transition-colors text-sm">
                  Selaa koneita
                </Link>
                <span className="mx-2 text-tertiary">/</span>
                <span className="text-primary text-sm font-medium truncate max-w-[200px]">
                  {listing.title}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => favToggle.mutate({ listingId: id }, { onSuccess: () => favState.refetch() })}
                className={cn("p-2 rounded-full", favState.data?.favorited && "text-[var(--color-success)]")}
              >
                {favState.data?.favorited ? <CheckCircle className="w-5 h-5 text-[var(--color-success)]" /> : <Heart className="w-5 h-5" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 rounded-full"
                onClick={() => {
                  const url = `${window.location.origin}/osta/${id}`;
                  if (navigator.share) {
                    navigator.share({ url, title: listing.title });
                  } else {
                    void navigator.clipboard.writeText(url);
                  }
                }}
                aria-label="Jaa"
                title="Jaa"
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-container">
        {showPurchased && (
          <div className="mb-4">
            <div className="rounded-xl border border-[var(--color-border)] bg-gradient-to-r from-[var(--color-secondary)]/10 to-[var(--color-primary)]/10 p-4">
              <div className="flex items-center gap-2 text-[var(--color-text-primary)]">
                <CheckCircle className="w-5 h-5 text-[var(--color-success)]" />
                <div className="font-semibold">Osto vahvistettu</div>
              </div>
              <div className="text-sm text-[var(--color-text-secondary)] mt-1">Kiitos ostoksesta! Saat pian vahvistussähköpostin ja toimitustiedot.</div>
            </div>
          </div>
        )}
         {/* Status banner (shown only when not ACTIVE) */}
         {(() => {
           const status = (listing?.status as string | undefined) ?? 'ACTIVE';
           if (status === 'ACTIVE') return null;
           const isSold = status === 'SOLD';
           const message = isSold ? 'Tämä listaus on myyty.' : 'Tämä listaus on arkistoitu.';
           const colorClasses = isSold
             ? 'border-[var(--color-error)]/40 bg-[var(--color-error)]/10'
             : 'border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10';
           return (
             <div className="mb-4">
               <div className={cn('rounded-xl border p-4 flex items-center gap-2', colorClasses)}>
                 <Info className={cn('w-5 h-5', isSold ? 'text-[var(--color-error)]' : 'text-[var(--color-warning)]')} />
                 <div className="font-semibold text-[var(--color-text-primary)]">{message}</div>
               </div>
             </div>
           );
         })()}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Content - Left Column */}
          <div className="order-2 xl:order-1 xl:col-span-2 space-y-6">
                {/* Main Gallery Card */}
      <Card className="overflow-hidden bg-gradient-to-br from-surface-2 to-surface-1 border-[var(--color-border-light)] shadow-lg hover:shadow-xl transition-all duration-500">
        <CardContent className="p-0">
          <div className="space-y-0">
            {/* Main Image Display (cover, no backdrop) */}
            <div className="relative aspect-video overflow-hidden group cursor-pointer rounded-lg" onClick={() => openModal(selectedImageIndex)}>
              {currentImage ? (
                <Image 
                  src={currentImage}
                  alt={`${listing.title} - kuva ${selectedImageIndex + 1}`}
                  fill
                  className="object-contain edge-fade py-2 rounded-lg"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                  priority
                />
              ) : (
                <div className="w-full h-full min-h-[180px] flex items-center justify-center bg-gradient-to-br from-[var(--color-surface-3)] to-[var(--color-surface-2)] rounded-lg">
                  <div className="flex flex-col items-center justify-center text-[var(--color-neutral)]/60">
                    <div className="relative">
                      <span className="text-5xl sm:text-6xl md:text-7xl font-extrabold italic bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
                        R
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)]/20 to-[var(--color-accent)]/20 blur-xl scale-150" aria-hidden />
                    </div>
                    <span className="text-xs sm:text-sm mt-2 font-medium">Ei kuvaa</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Thumbnail Gallery (fix border cut-off) */}
            {images && images.length > 1 ? (
              <div className="p-4 sm:p-6">
                <div className="flex gap-3 overflow-x-auto p-6">
                  {images.map((image: string, index: number) => (
                    <button
                      key={`thumb-${index}`}
                      onClick={() => setSelectedImageIndex(index)}
                      className="relative flex-shrink-0"
                      aria-label={`Valitse kuva ${index + 1}`}
                    >
                      <div className={cn(
                        "relative aspect-square w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden",
                        "border",
                        selectedImageIndex === index ? "border-[var(--color-primary)]" : "border-[var(--color-border)]"
                      )}>
                        {image ? (
                          <Image 
                            src={image} 
                            alt={`Thumbnail ${index + 1}`}
                            fill
                            className="object-contain edge-fade-mask rounded-lg"
                            sizes="80px"
                          />
                        ) : (
                          <div className="w-full h-full min-h-[64px] flex items-center justify-center bg-gradient-to-br from-[var(--color-surface-3)] to-[var(--color-surface-2)]">
                            <span className="text-lg font-extrabold italic bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
                              R
                            </span>
                          </div>
                        )}
                      </div>
                      {selectedImageIndex === index && (
                        <div className="absolute -inset-1 rounded-[0.9rem] ring-2 ring-[var(--color-primary)]/40 pointer-events-none" />
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Image counter */}
                <div className="text-center mt-3 text-sm text-tertiary">
                  {selectedImageIndex + 1} / {images.length}
                </div>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Full-screen Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center">
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={closeModal}
            className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 backdrop-blur-sm transition-all duration-300"
          >
            <X className="w-5 h-5" />
          </Button>
          
          {/* Navigation arrows */}
          {images && images.length > 1 ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 backdrop-blur-sm transition-all duration-300"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 backdrop-blur-sm transition-all duration-300"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </>
          ) : null}
          
          {/* Action buttons */}
          <div className="absolute top-4 left-4 z-50 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsZoomed(!isZoomed)}
              className="bg-black/50 hover:bg-black/70 text-white rounded-full p-3 backdrop-blur-sm transition-all duration-300"
            >
              {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadImage}
              className="bg-black/50 hover:bg-black/70 text-white rounded-full p-3 backdrop-blur-sm transition-all duration-300"
            >
              <Download className="w-5 h-5" />
            </Button>
            {typeof navigator !== 'undefined' && 'share' in navigator ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={shareImage}
                className="bg-black/50 hover:bg-black/70 text-white rounded-full p-3 backdrop-blur-sm transition-all duration-300"
              >
                <Share2 className="w-5 h-5" />
              </Button>
          ) : null}
          </div>
          
          {/* Modal image */}
          <div className={cn(
            "relative w-full h-full flex items-center justify-center p-4 transition-transform duration-300",
            isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"
          )} onClick={() => setIsZoomed(!isZoomed)}>
            <Image
              src={images[modalImageIndex]}
              alt={`${listing.title} - kuva ${modalImageIndex + 1}`}
              width={1920}
              height={1080}
              className={cn(
                "max-w-full max-h-full object-contain transition-transform duration-500 edge-fade-mask rounded-2xl",
                isZoomed ? "scale-150 sm:scale-200" : "scale-100"
              )}
              priority
            />
          </div>
          
          {/* Image info bar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-black/50 backdrop-blur-md rounded-full px-4 py-2 text-white text-sm">
            {modalImageIndex + 1} / {images.length}
            {images && images.length > 1 ? (
              <span className="ml-2 text-white/70">• Use arrow keys to navigate</span>
            ) : null}
          </div>
        </div>

        )}

            {/* Description */}
            <Card className="bg-surface-2 border-[var(--color-border-light)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl-fluid">
                  <Info className="w-5 h-5 text-[var(--color-primary)]" />
                  Kuvaus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert max-w-none">
                  {listing.description ? (
                    listing.description
                      .split(/\n{2,}/g)
                      .map((para: string, idx: number) => (
                        <p
                          key={idx}
                          className="text-secondary leading-relaxed mb-4 last:mb-0 whitespace-pre-line"
                        >
                          {para.trim()}
                        </p>
                      ))
                  ) : (
                    <p className="text-tertiary italic">Ei kuvausta saatavilla</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Specifications */}
            <Card className="bg-surface-2 border-[var(--color-border-light)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl-fluid">
                  <Cpu className="w-5 h-5 text-[var(--color-primary)]" />
                  Tekniset tiedot
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {specs.map((spec, idx) => (
                    <div 
                      key={idx}
                      className="group p-4 bg-surface-1 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-border-light)] transition-all"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <spec.Icon className={cn("h-5 w-5", spec.color)} />
                        <span className="text-sm font-medium text-secondary group-hover:text-primary transition-colors">
                          {spec.label}
                        </span>
                      </div>
                      <p className="text-primary font-semibold pl-8 group-hover:text-gradient-primary transition-all">
                        {spec.value}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* FPS Estimates - compact and responsive */}
            <Card className="bg-surface-2 border-[var(--color-border-light)]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-xl-fluid">
                    <Gamepad2 className="w-5 h-5 text-[var(--color-primary)]" />
                    Arvioitu FPS
                  </CardTitle>
                  <span className="text-xs text-tertiary">Arvio – ei takuuarvo</span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-xs text-secondary">Peli:</span>
                  <Select onValueChange={(v) => setSelectedGame(v)} value={selectedGame ?? undefined}>
                    <SelectTrigger className="h-10 w-64 rounded-lg bg-surface-1 backdrop-blur-sm border-[var(--color-border)] text-primary focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/30">
                      <SelectValue placeholder="Valitse peli" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-2 backdrop-blur-md border-[var(--color-border)] shadow-xl">
                      {estimatedGameFps.map((g) => (
                        <SelectItem key={g.game} value={g.game}>{g.game}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <CardDescription className="text-secondary mt-2">
                  Suuntaa-antavat ruudunpäivitysnopeudet eri resoluutioilla ja asetuksilla.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {!selectedGame && (
                  <div className="flex flex-col items-center justify-center text-center py-8 bg-surface-1 rounded-lg border border-[var(--color-border)]">
                    <Gamepad2 className="w-8 h-8 text-[var(--color-accent)] mb-2" />
                    <p className="text-sm text-secondary">Valitse peli nähdäksesi arvioidun FPS:n eri asetuksilla</p>
                  </div>
                )}
                {selectedGame && (() => {
                  const gameData = estimatedGameFps.find(g => g.game === selectedGame);
                  if (!gameData) return null;
                  return (
                    <div className="bg-gradient-to-b from-surface-1 to-surface-2 rounded-xl border border-[var(--color-border)] p-4">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <h3 className="text-base font-semibold text-primary flex items-center gap-2 truncate">
                          <Gamepad2 className="w-4 h-4 text-[var(--color-accent)]" />
                          <span className="truncate">{gameData.game}</span>
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {gameData.resolutions.map((resData, resIdx) => (
                          <div key={resIdx} className="rounded-lg bg-surface-1 border border-[var(--color-border)] p-3">
                            <p className="text-xs font-semibold text-secondary mb-2">{resData.resolution}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {resData.settings.map((setting, settingIdx) => (
                                <span
                                  key={settingIdx}
                                  className="inline-flex items-center gap-1 text-xs font-medium rounded-md px-2 py-1 border border-[var(--color-border)] bg-surface-2 text-primary"
                                >
                                  <span className="text-tertiary">{setting.quality}</span>
                                  <span className="h-1 w-1 rounded-full bg-[var(--color-border-light)]" />
                                  <span className="font-semibold">{setting.fps}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Right Column (on mobile/tablet shown first) */}
          <div className="order-1 xl:order-2 space-y-6 md:max-w-[640px] md:mx-auto xl:max-w-none xl:mx-0 w-full">
            {/* Purchase Card */}
            <Card className="w-full xl:sticky xl:top-24 md:rounded-lg bg-gradient-to-br from-surface-2 to-surface-3 border-[var(--color-border-light)] shadow-xl">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl-fluid font-bold text-primary leading-tight mb-2">
                      {listing.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={cn("text-xs font-semibold px-2 py-1", getConditionColor(listing.condition))}>
                        {listing.condition ?? 'Tuntematon kunto'}
                      </Badge>
                      {listing.createdAt && (
                        <span className="text-xs text-tertiary flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(listing.createdAt), 'dd.MM.yyyy', { locale: fi })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Performance Rating */}
                <div className="flex flex-col gap-2 xs:gap-3 p-3 bg-surface-1 rounded-lg
                  sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Gamepad2 className="w-5 h-5 text-[var(--color-accent)] flex-shrink-0" />
                    <span className="text-sm font-medium text-secondary truncate">Suorituskyky</span>
                  </div>
                  <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2 sm:justify-end w-full sm:w-auto">
                    <div className="flex gap-0.5 xs:gap-1 justify-start xs:justify-end">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "w-4 h-4",
                            i < performance.rating 
                              ? "text-[var(--color-warning)] fill-current" 
                              : "text-tertiary"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-primary text-left xs:text-right">{performance.label}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Price (with discount if active) */}
                {(() => {
                  const basePriceNum = Number(listing.basePrice ?? 0);
                  const discountAmountNum = ('discountAmount' in listing && (listing as any).discountAmount != null)
                    ? Number((listing as any).discountAmount) : 0;
                  const now = new Date();
                  const hasWindow = ('discountStart' in listing && 'discountEnd' in listing
                    && (listing as any).discountStart && (listing as any).discountEnd)
                    ? now >= new Date(String((listing as any).discountStart)) && now <= new Date(String((listing as any).discountEnd))
                    : false;
                  const finalPrice = hasWindow && discountAmountNum > 0
                    ? Math.max(0, basePriceNum - discountAmountNum)
                    : basePriceNum;
                  return (
                    <div className="text-center p-6 bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 rounded-xl border border-[var(--color-primary)]/20">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Euro className="w-4 h-4 text-[var(--color-secondary-light)] mr-2" />
                        <span className="text-sm text-secondary">Hinta</span>
                      </div>
                      {hasWindow && discountAmountNum > 0 ? (
                        <div className="space-y-2">
                          <div className="inline-flex items-center gap-2">
                            <span className="badge-spotlight animate-pulse-soft inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/40 text-[var(--color-accent)] text-xs font-semibold">
                              ✨ Alennus
                            </span>
                          </div>
                          <div className="flex items-center justify-center gap-3">
                            <span className="text-xl text-tertiary line-through">{basePriceNum} €</span>
                            <span className="glow-accent-hover text-4xl-fluid font-black bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-accent)] to-[var(--color-primary)] bg-clip-text text-transparent">
                              {finalPrice} €
                            </span>
                          </div>
                          <div className="text-xs text-tertiary">Alennus voimassa {new Date(String((listing as any).discountEnd)).toLocaleDateString('fi-FI')}</div>
                        </div>
                      ) : (
                        <div className="text-4xl-fluid font-black bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
                          {basePriceNum} €
                        </div>
                      )}
                      <p className="text-xs text-tertiary mt-1">Sisältää alv:n</p>
                    </div>
                  );
                })()}

                {/* Action Buttons (render only when ACTIVE) */}
                {(() => {
                  const status = (listing?.status as string | undefined) ?? 'ACTIVE';
                  if (status !== 'ACTIVE') return null;
                  return (
                    <div className="space-y-3">
                      <EnhancedPurchaseDialog
                        trigger={
                          <Button 
                            className="w-full h-12 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] hover:from-[var(--color-primary)]/90 hover:to-[var(--color-accent)]/90 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all"
                            size="lg"
                            onClick={(e) => {
                              // If not signed in, redirect to sign-in with return URL to this listing
                              try {
                                // Clerk injects __clerk on window in client; fall back to fetch if needed
                                const signedIn = (window as any)?.Clerk?.user?.id != null || (window as any)?.__clerk?.user?.id != null;
                                if (!signedIn) {
                                  e.preventDefault();
                                  const returnUrl = `${window.location.origin}/osta/${listing.id}`;
                                  window.location.href = `/sign-in?redirect_url=${encodeURIComponent(returnUrl)}`;
                                }
                              } catch { /* noop */ }
                            }}
                          >
                            <Zap className="w-5 h-5 mr-2" />
                            {(() => {
                              const basePriceNum = Number(listing.basePrice ?? 0);
                              const discountAmountNum = ('discountAmount' in listing && (listing as any).discountAmount != null)
                                ? Number((listing as any).discountAmount) : 0;
                              const now = new Date();
                              const hasWindow = ('discountStart' in listing && 'discountEnd' in listing
                                && (listing as any).discountStart && (listing as any).discountEnd)
                                ? now >= new Date(String((listing as any).discountStart)) && now <= new Date(String((listing as any).discountEnd))
                                : false;
                              const finalPrice = hasWindow && discountAmountNum > 0
                                ? Math.max(0, basePriceNum - discountAmountNum)
                                : basePriceNum;
                              return `Osta nyt ${finalPrice} €`;
                            })()}
                          </Button>
                        }
                        productTitle={listing.title ?? "Tuote"}
                        priceEUR={(() => {
                          const basePriceNum = Number(listing.basePrice ?? 0);
                          const discountAmountNum = ('discountAmount' in listing && (listing as any).discountAmount != null)
                            ? Number((listing as any).discountAmount) : 0;
                          const now = new Date();
                          const hasWindow = ('discountStart' in listing && 'discountEnd' in listing
                            && (listing as any).discountStart && (listing as any).discountEnd)
                            ? now >= new Date(String((listing as any).discountStart)) && now <= new Date(String((listing as any).discountEnd))
                            : false;
                          return hasWindow && discountAmountNum > 0
                            ? Math.max(0, basePriceNum - discountAmountNum)
                            : basePriceNum;
                        })()}
                        onConfirm={async () => {
                          // Guard server call as well to avoid 401
                          try {
                            const signedIn = (window as any)?.Clerk?.user?.id != null || (window as any)?.__clerk?.user?.id != null;
                            if (!signedIn) {
                              const returnUrl = `${window.location.origin}/osta/${listing.id}`;
                              window.location.href = `/sign-in?redirect_url=${encodeURIComponent(returnUrl)}`;
                              return;
                            }
                          } catch { /* noop */ }
                          try {
                            const successUrl = `${window.location.origin}/osta/${listing.id}?maksu=onnistui`;
                            const cancelUrl = `${window.location.origin}/osta/${listing.id}?maksu=peruttu`;
                            const res = await createCheckout.mutateAsync({
                              companyListingId: listing.id,
                              successUrl,
                              cancelUrl,
                            });
                            const stripe = await getStripe();
                            if (stripe) {
                              await stripe.redirectToCheckout({ sessionId: res.id });
                            } else if (res.url) {
                              window.location.href = res.url;
                            }
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        confirmLabel="Siirry kassalle"
                        cancelLabel="Sulje"
                      />
                    </div>
                  );
                })()}

                {/* Trust Indicators */}
                <div className="space-y-3 pt-4 border-t border-[var(--color-border)]">
                  <h4 className="text-sm font-semibold text-primary mb-3">Miksi ostaa meiltä?</h4>
                  <div className="space-y-2">
                    {[
                      { icon: Shield, text: "12 kuukauden takuu", color: "text-[var(--color-success)]" },
                      { icon: Truck, text: "Ilmainen toimitus", color: "text-[var(--color-primary)]" },
                      { icon: CheckCircle, text: "Testattu ja kunnostettu", color: "text-[var(--color-secondary)]" },
                      { icon: User, text: "Asiantunteva tuki", color: "text-[var(--color-accent)]" }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-sm">
                        <item.icon className={cn("w-4 h-4", item.color)} />
                        <span className="text-secondary">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Content Area */}
        <div className="mt-8 space-y-6 max-w-7xl mx-auto">
          {/* Shipping, Warranty, Service Agreement - Collapsible Sections */}
          <Card className="bg-surface-2 border-[var(--color-border-light)]">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-primary">
                Toimitus, Takuu ja Huoltosopimus
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 md:p-8 space-y-4">
              <CollapsibleComponent
                title="Toimitus"
                icon={<Truck className="h-5 w-5 min-w-[1.25rem] min-h-[1.25rem]" />}
              >
                <p className="text-sm sm:text-base text-[var(--color-neutral)]/80 leading-relaxed">
                  Verkkokaupassamme asiointi on helppoa ja vaivatonta aina tilaamisesta toimitukseen asti. Kaikki tilaukset lähetetään aina viimeistään seuraavana arkipäivänä tilauksen tekemisestä, joten voit odottaa pakettisi saapuvan nopeasti – tyypillisesti 2-4 arkipäivän kuluessa. Lisäksi tarjoamme kaikille tilauksille ilmaisen toimituksen, joten voit tehdä ostoksia ilman ylimääräisiä kuluja.
                  <br /><br />
                  Pidämme sinut ajan tasalla tilauksesi etenemisestä ja ilmoitamme, kun pakettisi on matkalla.
                </p>
              </CollapsibleComponent>

              <CollapsibleComponent
                title="Takuu ja palautukset"
                icon={<ShieldCheck className="h-5 w-5 min-w-[1.25rem] min-h-[1.25rem]" />}
              >
                <h4 className="font-semibold text-sm sm:text-base text-[var(--color-neutral)] mb-2">Palautusoikeus</h4>
                <p className="text-sm sm:text-base text-[var(--color-neutral)]/80 leading-relaxed mb-4">
                  Haluamme, että olet täysin tyytyväinen ostoksiisi. Siksi tarjoamme kaikille tuotteille 14 päivän palautusoikeuden. Jos jostain syystä et ole tyytyväinen ostokseesi, voit palauttaa sen alkuperäisessä kunnossa ja pakkauksessa 14 päivän kuluessa tilauksen vastaanottamisesta. Palautus on maksuton. <Link href="/takuu" className="text-[var(--color-primary)] hover:underline">Voit lukea lisää palautusehdoistamme.</Link>
                </p>
                <h4 className="font-semibold text-sm sm:text-base text-[var(--color-neutral)] mb-2">Vuoden takuu</h4>
                <p className="text-sm sm:text-base text-[var(--color-neutral)]/80 leading-relaxed">
                  Kaikilla tuotteillamme on vuoden takuu, joka kattaa tekniset viat. Takuu alkaa ostopäivästä ja se kattaa valmistus- ja materiaalivirheet, jotka vaikuttavat tuotteen normaaliin käyttöön. Mikäli tuotteessasi ilmenee takuuaikana teknisiä vikoja, korjaamme tai vaihdamme tuotteen maksutta. <Link href="/takuu" className="text-[var(--color-primary)] hover:underline">Voit lukea takuusta lisää takuuehdoistamme.</Link>
                  <br /><br />
                  Jos sinulla on kysyttävää takuusta tai palautusprosessista, ota rohkeasti yhteyttä asiakaspalveluumme. Olemme täällä auttaaksemme!
                </p>
              </CollapsibleComponent>

              <CollapsibleComponent
                title="Repur RESPAWN™ Huoltosopimus"
                icon={<Zap className="h-5 w-5 min-w-[1.25rem] min-h-[1.25rem]" />}
              >
                <p className="text-sm sm:text-base text-[var(--color-neutral)]/80 leading-relaxed mb-3">
                  Repur RESPAWN™ Huoltosopimus on avain huolettomaan pelikokemukseen ja täydelliseen mielenrauhaan. Kun ostat koneesi Repurlta, saat rajoitetun ajan täysin maksutta kattavan palvelupaketin, joka sisältää:
                </p>
                <ul className="text-sm sm:text-base text-[var(--color-neutral)]/80 list-disc list-inside space-y-1">
                  <li>12 kuukauden takuu kaikille osille</li>
                  <li>Etätuki ongelmatilanteissa</li>
                  <li>Ilmainen vianmääritys ja korjaus</li>
                  <li>Takuuhuolto kahdessa päivässä</li>
                </ul>
                <Link href="/tuki" className="text-[var(--color-primary)] hover:underline text-sm sm:text-base mt-3 inline-block">Lue lisää huoltosopimuksesta</Link>
              </CollapsibleComponent>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}