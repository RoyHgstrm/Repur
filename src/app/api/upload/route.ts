import { writeFile, mkdir } from 'fs/promises';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import path from 'path';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const files = formData.getAll('images');

  if (!files || files.length === 0) {
    return NextResponse.json({ error: 'No files uploaded.' }, { status: 400 });
  }

  const uploadedImageUrls: string[] = [];

  const uploadDir = path.join(process.cwd(), 'public', 'uploads');

  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (error) {
    console.error('Error creating upload directory:', error);
    return NextResponse.json({ error: 'Failed to create upload directory.' }, { status: 500 });
  }

  for (const file of files) {
    if (file instanceof Blob) {
      const buffer = Buffer.from(await file.arrayBuffer());
	  // HOW: Sanitize the original filename to a URL-safe, filesystem-safe format without spaces.
	  // WHY: In production, spaces and special characters can break Next.js image optimization and static serving.
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
      const safeName = `${nanoid()}-${base}${ext ? `.${ext}` : ''}`;
      const filePath = path.join(uploadDir, safeName);

      try {
        await writeFile(filePath, buffer);
        uploadedImageUrls.push(`/uploads/${safeName}`);
      } catch (error) {
        console.error('Error saving file:', error);
        return NextResponse.json({ error: 'Failed to save image.' }, { status: 500 });
      }
    } else {
      console.warn('Skipping non-blob file entry:', file);
    }
  }

  return NextResponse.json({ imageUrls: uploadedImageUrls });
}