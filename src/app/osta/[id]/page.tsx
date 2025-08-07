"use client"
import { api } from '~/trpc/react';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { 
  DollarSign, 
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
  ShieldCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import Image from 'next/image';
import Link from 'next/link';
import { nanoid } from 'nanoid';
import { useParams, useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { type RouterOutputs } from '~/trpc/react';
import { cn } from '~/lib/utils';
import CollapsibleComponent from '~/components/ui/CollapsibleComponent';
import { FPS_DATA } from '~/lib/fpsConstants';

type DetailedListing = RouterOutputs['listings']['getCompanyListingById'] & {
  seller?: { name: string | null; };
  evaluatedBy?: { name: string | null; };
};

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  const { data: listingData, isLoading, error } = api.listings.getCompanyListingById.useQuery({ id });

  const listing = listingData as DetailedListing;

  // Performance rating based on components
  const getPerformanceRating = (gpu: string | null, cpu: string | null) => {
    const gpuLower = (gpu ?? '').toLowerCase();
    const cpuLower = (cpu ?? '').toLowerCase();
    
    if (gpuLower.includes('rtx 40') || gpuLower.includes('rx 7') || 
        cpuLower.includes('i9') || cpuLower.includes('ryzen 9')) return { rating: 5, label: 'Huippusuoritus' };
    if (gpuLower.includes('rtx 30') || gpuLower.includes('rx 6') || 
        cpuLower.includes('i7') || cpuLower.includes('ryzen 7')) return { rating: 4, label: 'Erinomainen' };
    if (gpuLower.includes('gtx') || gpuLower.includes('rx 5') || 
        cpuLower.includes('i5') || cpuLower.includes('ryzen 5')) return { rating: 3, label: 'Hyvä' };
    return { rating: 2, label: 'Perus' };
  };

  const getConditionColor = (condition: string | null) => {
    switch (condition) {
      case 'Uusi': return 'bg-gradient-to-r from-emerald-500 to-green-400 text-white';
      case 'Kuin uusi': return 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white';
      case 'Hyvä': return 'bg-gradient-to-r from-yellow-500 to-orange-400 text-white';
      case 'Tyydyttävä': return 'bg-gradient-to-r from-red-500 to-pink-400 text-white';
      default: return 'bg-gradient-to-r from-gray-500 to-slate-400 text-white';
    }
  };

  // Simplified FPS estimation based on performance rating
  // HOW: This function estimates FPS for different games and settings based on the system's performance rating.
  // WHY: Provides users with a clear, relatable measure of a PC's gaming capability, enhancing transparency and user confidence, without requiring complex real-world benchmarks on every listing.
  const getEstimatedFps = (rating: number) => {
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
      const calculatedFps = Math.round(
        (FPS_DATA.BASE_FPS + (rating - 3) * FPS_DATA.RATING_ADJUST) * multiplier
      );
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
  };

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
      notFound();
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

  if (!listing) {
    notFound();
  }

  const performance = getPerformanceRating(listing.gpu, listing.cpu);
  const estimatedGameFps = getEstimatedFps(performance.rating);
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
      <div className="sticky top-0 z-40 bg-surface-1/80 backdrop-blur-md border-b border-[var(--color-border)]">
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
                onClick={() => setIsFavorited(!isFavorited)}
                className={cn("p-2 rounded-full", isFavorited && "text-red-500")}
              >
                <Heart className={cn("w-5 h-5", isFavorited && "fill-current")} />
              </Button>
              <Button variant="ghost" size="sm" className="p-2 rounded-full">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-container">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Content - Left Column */}
          <div className="xl:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card className="overflow-hidden bg-surface-2 border-[var(--color-border-light)]">
              <CardContent className="p-0">
                {listing.images && listing.images.length > 0 ? (
                  <div className="space-y-4">
                    {/* Main Image */}
                    <div className="relative aspect-video bg-surface-1 group cursor-pointer">
                      <Image 
                        src={listing.images[selectedImageIndex] ?? listing.images[0]}
                        alt={`${listing.title} - kuva ${selectedImageIndex + 1}`}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    
                    {/* Thumbnail Gallery */}
                    {listing.images.length > 1 && (
                      <div className="p-4">
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {listing.images.map((image: string, index: number) => (
                            <button
                              key={nanoid()}
                              onClick={() => setSelectedImageIndex(index)}
                              className={cn(
                                "relative aspect-square w-20 h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0",
                                selectedImageIndex === index 
                                  ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20" 
                                  : "border-[var(--color-border)] hover:border-[var(--color-primary)]/50"
                              )}
                            >
                              <Image 
                                src={image} 
                                alt={`Thumbnail ${index + 1}`}
                                fill
                                className="object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-surface-1 to-surface-3 flex flex-col items-center justify-center text-tertiary p-8">
                    <ImageIcon className="h-16 w-16 mb-4 opacity-50" />
                    <span className="text-lg-fluid font-medium">Ei kuvia saatavilla</span>
                    <span className="text-sm text-tertiary mt-1">Kuvat lisätään pian</span>
                  </div>
                )}
              </CardContent>
            </Card>

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

            {/* FPS Estimates */}
            <Card className="bg-surface-2 border-[var(--color-border-light)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl-fluid">
                  <Gamepad2 className="w-5 h-5 text-[var(--color-primary)]" />
                  Arvioitu FPS
                </CardTitle>
                <CardDescription className="text-secondary">
                  Nämä ovat arvioita pelien ruudunpäivitysnopeuksista eri asetuksilla. Todellinen suorituskyky voi vaihdella.
                  Lähde: [UL Benchmarks](https://support.benchmarks.ul.com/support/solutions/articles/44002196922-game-performance-estimation)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-md space-y-4">
                {estimatedGameFps.map((gameData, gameIdx) => (
                  <div key={gameIdx} className="group relative bg-surface-1 rounded-lg border border-[var(--color-border)] p-4 overflow-hidden transition-all duration-300 hover:shadow-md">
                    {/* Animated gradient background on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/5 to-[var(--color-accent)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10">
                      <h3 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
                        <Gamepad2 className="w-5 h-5 text-[var(--color-accent)]" />
                        {gameData.game}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-4">
                        {gameData.resolutions.map((resData, resIdx) => (
                          <div key={resIdx} className="space-y-1">
                            <p className="text-sm font-medium text-secondary">{resData.resolution}</p>
                            <ul className="space-y-0.5">
                              {resData.settings.map((setting, settingIdx) => (
                                <li key={settingIdx} className="flex justify-between items-center text-xs text-tertiary">
                                  <span className="flex items-center gap-1.5">
                                    {setting.quality}:
                                  </span>
                                  <span className="font-semibold text-primary rounded-md bg-surface-2 px-2 py-0.5 border border-[var(--color-border)]">
                                    {setting.fps} FPS
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            {/* Purchase Card */}
            <Card className="sticky top-24 bg-gradient-to-br from-surface-2 to-surface-3 border-[var(--color-border-light)] shadow-xl">
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
                {/* Price */}
                <div className="text-center p-6 bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 rounded-xl border border-[var(--color-primary)]/20">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <DollarSign className="h-6 w-6 text-[var(--color-success)]" />
                    <span className="text-sm text-secondary">Hinta</span>
                  </div>
                  <div className="text-4xl-fluid font-black bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
                    {listing.basePrice} €
                  </div>
                  <p className="text-xs text-tertiary mt-1">Sisältää alv:n</p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button 
                    className="w-full h-12 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] hover:from-[var(--color-primary)]/90 hover:to-[var(--color-accent)]/90 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all"
                    size="lg"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Osta Nyt {listing.basePrice} €
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-[var(--color-border-light)] hover:bg-[var(--color-primary)]/10 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                    >
                      <Heart className="w-4 h-4 mr-1" />
                      Tallenna
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-[var(--color-border-light)] hover:bg-[var(--color-secondary)]/10 hover:border-[var(--color-secondary)] hover:text-[var(--color-secondary)]"
                    >
                      <Share2 className="w-4 h-4 mr-1" />
                      Jaa
                    </Button>
                  </div>
                </div>

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