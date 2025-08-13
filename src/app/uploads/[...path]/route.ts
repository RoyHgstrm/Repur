import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import path from 'path'
import { readFile, stat } from 'fs/promises'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const uploadRoot = path.join(process.cwd(), 'uploads')

function getContentType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? ''
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'webp':
      return 'image/webp'
    case 'avif':
      return 'image/avif'
    case 'gif':
      return 'image/gif'
    default:
      return 'application/octet-stream'
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: parts } = await params
    // Prevent path traversal
    const joined = path.join(uploadRoot, ...parts)
    const normalized = path.normalize(joined)
    if (!normalized.startsWith(uploadRoot)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const st = await stat(normalized)
    if (!st.isFile()) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 })
    }

    const data = await readFile(normalized)
    const ct = getContentType(normalized)
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        'Content-Type': ct,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    })
  } catch {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }
}


