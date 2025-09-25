import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid'; // Import nanoid for unique file names
import { auth } from '@clerk/nextjs/server'; // Import Clerk's auth
import { createClient } from '@supabase/supabase-js'; // Import createClient for admin client

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // 1. Get the user ID directly from Clerk
    const { userId } = await auth(); // Await auth() to get the session details

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: No Clerk session.' }, { status: 401 });
    }

    // 2. Create an admin Supabase client using the service role key
    // This bypasses RLS, so you must authorize actions based on the `userId`
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('Authenticated Clerk user ID for upload:', userId);

    // Process file upload
    const formData = await request.formData();
    const files = formData.getAll('images');

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Ei tiedostoa' }, { status: 400 });
    }

    const uploadedImageUrls: string[] = [];

    for (const file of files) {
      if (file instanceof Blob) {
        if (file.size > 5 * 1024 * 1024) {
          return NextResponse.json({ error: `Kuva ${file.name} on liian suuri (max 5 Mt)` }, { status: 400 });
        }

        if (!['image/jpeg', 'image/png'].includes(file.type)) {
          return NextResponse.json({ error: `Vain JPG/PNG-tiedostot ovat sallittuja: ${file.name}` }, { status: 400 });
        }

        const originalName = typeof (file as any).name === 'string' ? (file as any).name : 'image';
        const dotIndex = originalName.lastIndexOf('.');
        const rawExt = dotIndex > -1 ? originalName.slice(dotIndex + 1) : '';
        const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, '');
        const baseRaw = dotIndex > -1 ? originalName.slice(0, dotIndex) : originalName;
        const base = baseRaw
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-_]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '') || 'image';
        // Prepend Clerk userId to file name for organization and future RLS if needed.
        const safeName = `${userId}/${nanoid()}-${base}${ext ? `.${ext}` : ''}`;

        const { data, error } = await supabaseAdmin.storage // Use supabaseAdmin for upload
          .from('images')
          .upload(safeName, file, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false,
          });

        if (error) {
          console.error('Upload error:', error.message);
          return NextResponse.json({ error: 'Kuvan lataus epäonnistui' }, { status: 500 });
        }
        uploadedImageUrls.push(data.path);
      } else {
        console.warn('Skipping non-blob file entry:', file);
      }
    }
    return NextResponse.json({ imageUrls: uploadedImageUrls });
  } catch (error) {
    console.error('Unexpected error in /api/upload:', error);
    return NextResponse.json({ error: 'Odottamaton virhe' }, { status: 500 });
  }
}
