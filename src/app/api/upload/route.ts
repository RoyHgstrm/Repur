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
      const filename = `${nanoid()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_ ')}`;
      const filePath = path.join(uploadDir, filename);

      try {
        await writeFile(filePath, buffer);
        uploadedImageUrls.push(`/uploads/${filename}`);
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