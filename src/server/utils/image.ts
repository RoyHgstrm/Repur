import { redis } from '~/lib/redis'; // Import the Upstash Redis client
import { supabase } from '~/lib/supabase'; // Import the Supabase client

// HOW: Fetches an image URL, utilizing Upstash Redis for caching and Supabase for public URL generation.
// WHY: Improves performance by reducing redundant calls to Supabase and optimizes image delivery, strictly on the server.
export async function getImage(id: string): Promise<string> {
  const cacheKey = `image:${id}`;
  const cached = await redis.get<string>(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch public URL from Supabase WITHOUT transformations for now
  const { data } = supabase.storage.from('images').getPublicUrl(id);

  if (!data?.publicUrl) {
    throw new Error('Kuvan haku epäonnistui.');
  }

  // Cache the public URL for 1 day
  await redis.set(cacheKey, data.publicUrl, { ex: 86400 }); // 1 day TTL

  return data.publicUrl;
}
