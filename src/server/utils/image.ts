import { redis } from '~/lib/redis'; // Import the Upstash Redis client
import { supabase } from '~/lib/supabase'; // Import the Supabase client

// HOW: Robustly fetches an image URL, utilizing Upstash Redis for caching and Supabase for public URL generation.
// WHY: Improves performance by reducing redundant calls to Supabase and optimizes image delivery. Handles cases where input is already a full URL.
export async function getImage(inputPath: string): Promise<string> {
  // If inputPath is already a full Supabase URL, extract the object key.
  const supabaseUrlPrefix = `${supabase.storage.from('images').getPublicUrl('').data?.publicUrl ?? ''}`.replace(/\/$/,""); // Ensure no trailing slash
  let imageKey = inputPath;

  if (inputPath.startsWith(supabaseUrlPrefix)) {
    // Extract the object key by removing the public URL prefix
    imageKey = inputPath.substring(supabaseUrlPrefix.length + 1); // +1 to remove the leading slash from the key
  }

  const cacheKey = `image:${imageKey}`;
  const cached = await redis.get<string>(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch public URL from Supabase using the extracted imageKey
  const { data } = supabase.storage.from('images').getPublicUrl(imageKey);

  if (!data?.publicUrl) {
    // Fallback if publicUrl is still not found or invalid
    // This might happen if imageKey itself was invalid or bucket issue.
    // Consider returning a placeholder image URL or re-throwing for unrecoverable errors.
    console.error(`Failed to get public URL for imageKey: ${imageKey}. Full inputPath: ${inputPath}`);
    // For now, re-throw as it indicates a serious problem
    throw new Error('Kuvan haku epäonnistui.');
  }

  // Cache the public URL for 1 day
  await redis.set(cacheKey, data.publicUrl, { ex: 86400 }); // 1 day TTL

  return data.publicUrl;
}
