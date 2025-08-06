"use client"
import { api } from '~/trpc/react';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card';
import { DollarSign, Cpu, Gauge, MemoryStick, HardDrive, Power, Server, Package, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import { nanoid } from 'nanoid';
import { useParams } from 'next/navigation';
import React from 'react';
import { type RouterOutputs } from '~/trpc/react';

type DetailedListing = RouterOutputs['listings']['getCompanyListingById'] & {
  seller?: { name: string | null; };
  evaluatedBy?: { name: string | null; };
};

export default function ListingDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: listingData, isLoading, error } = api.listings.getCompanyListingById.useQuery({ id });

  const listing = listingData as DetailedListing;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse space-y-4 w-full max-w-4xl">
          <div className="h-10 bg-[var(--color-surface-3)] rounded w-3/4"></div>
          <div className="h-6 bg-[var(--color-surface-3)] rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
            <div className="space-y-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-4 bg-[var(--color-surface-3)] rounded"></div>
              ))}
            </div>
            <div className="aspect-video bg-[var(--color-surface-3)] rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    if (error.data?.code === 'NOT_FOUND') {
      notFound();
    }
    return <div className="text-[var(--color-error)] text-center py-8 text-lg-fluid">Virhe listauksen lataamisessa: {error.message}</div>;
  }

  if (!listing) {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto px-container py-section">
      <Card className="bg-[var(--color-surface-2)] rounded-2xl overflow-hidden border-0 shadow-xl dark:shadow-[var(--color-surface-3)]/20">
        <CardHeader className="p-6 md:p-8 bg-gradient-to-r from-[var(--color-surface-1)] to-[var(--color-surface-2)] border-b border-[var(--color-border)]">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <CardTitle className="text-3xl-fluid md:text-4xl-fluid font-bold text-[var(--color-neutral)] tracking-tight">
              {listing.title}
            </CardTitle>
            
            <div className="flex items-center gap-2 bg-[var(--color-surface-1)] px-4 py-3 rounded-lg shadow-sm">
              <DollarSign className="h-6 w-6 text-[var(--color-success)]" />
              <span className="text-3xl-fluid font-bold text-[var(--color-success)]">{listing.basePrice} €</span>
            </div>
          </div>
          
          <CardDescription className="mt-3 text-[var(--color-neutral)]/80 text-base-fluid leading-snug md:leading-relaxed">
            {listing.description
              ?.split(/\n{2,}/g)
              .map((para: string, idx: number) => (
                <span
                  key={idx}
                  className="block mb-2 last:mb-0 whitespace-pre-line"
                  style={{ wordBreak: "break-word" }}
                >
                  {para.trim()}
                </span>
              ))}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Specifications Section */}
            <div>
              <div className="mb-6 pb-2 border-b border-[var(--color-border)]">
                <h3 className="text-xl-fluid font-semibold text-[var(--color-neutral)] flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-[var(--color-primary)]" />
                  Tekniset tiedot
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[ 
                  { label: "Prosessori", value: listing.cpu, Icon: Cpu, iconColor: "text-[var(--color-primary)]" },
                  { label: "Näytönohjain", value: listing.gpu, Icon: Gauge, iconColor: "text-[var(--color-accent)]" },
                  { label: "RAM", value: listing.ram, Icon: MemoryStick, iconColor: "text-[var(--color-info)]" },
                  { label: "Tallennustila", value: listing.storage, Icon: HardDrive, iconColor: "text-[var(--color-success)]" },
                  { label: "Emolevy", value: listing.motherboard, Icon: Server, iconColor: "text-[var(--color-primary)]" },
                  { label: "Virtalähde", value: listing.powerSupply, Icon: Power, iconColor: "text-[var(--color-warning)]" },
                  { label: "Kotelo", value: listing.caseModel, Icon: Package, iconColor: "text-[var(--color-neutral)]/50" },
                  { label: "Kunto", value: listing.condition, iconColor: "text-[var(--color-neutral)]/50" },
                ].map((item, idx) => (
                  <div 
                    key={idx} 
                    className="bg-[var(--color-surface-3)] p-4 rounded-lg border border-[var(--color-border)]"
                  >
                    <div className="flex items-center gap-3 mb-1">
                      {item.Icon ? (
                        <item.Icon className={`h-5 w-5 ${item.iconColor}`} />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-[var(--color-surface-2)]"></div>
                      )}
                      <span className="text-sm font-medium text-[var(--color-neutral)]/80">{item.label}</span>
                    </div>
                    <p className="text-[var(--color-neutral)] font-medium pl-8">{item.value}</p>
                  </div>
                ))}
              </div>
              

            </div>

            {/* Images Section */}
            <div>
              <div className="mb-6 pb-2 border-b border-[var(--color-border)]">
                <h3 className="text-xl-fluid font-semibold text-[var(--color-neutral)] flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[var(--color-accent)]" />
                  Kuvat
                </h3>
              </div>
              
              {listing.images && listing.images.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {listing.images.map((image: string, index: number) => (
                    <div 
                      key={nanoid()} 
                      className="relative aspect-square rounded-xl overflow-hidden border border-[var(--color-border)] transition-all duration-300 hover:shadow-lg hover:border-[var(--color-primary)] group"
                    >
                      <Image 
                        src={image} 
                        alt={`Listing image ${index + 1}`} 
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full aspect-video bg-gradient-to-br from-[var(--color-surface-1)] to-[var(--color-surface-2)] rounded-xl flex flex-col items-center justify-center text-[var(--color-neutral)]/50 border-2 border-dashed border-[var(--color-border)] p-8">
                  <ImageIcon className="h-14 w-14 mb-4 opacity-50" />
                  <span className="text-lg-fluid">Ei kuvia saatavilla</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}