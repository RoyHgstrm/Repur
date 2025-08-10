import type { Metadata } from 'next';
import React from 'react';
import { api as createApiCaller } from '~/trpc/server';

// Next.js 15 may pass params as a Promise in layout-level generateMetadata
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    const resolved = await params;
    const api = createApiCaller({ headers: new Headers() });
    const listing = await api.listings.getCompanyListingById({ id: resolved.id });
    if (!listing) return {};

    const title = listing.title ?? 'Repur.fi';
    const description = (listing.description ?? '').slice(0, 160) || 'Kunnostettu pelikone 12 kk takuulla.';
    const image = Array.isArray(listing.images) && listing.images[0] ? String(listing.images[0]) : undefined;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: image ? [{ url: image, width: 1200, height: 630, alt: title }] : undefined,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: image ? [image] : undefined,
      },
    };
  } catch {
    return {};
  }
}

export default function ListingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}


