import { NextRequest, NextResponse } from 'next/server'

/**
 * Image proxy API - serves images from gtf.global production server
 * This allows serving legacy images without migrating all files
 *
 * Usage: /api/images/uploads/federations/kg_logo.png
 *        /api/images/storage/competitions/photo.jpg
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params
    const imagePath = path.join('/')

    // Construct the gtf.global URL
    const sourceUrl = `https://gtf.global/${imagePath}`

    // Fetch the image from production
    const response = await fetch(sourceUrl, {
      headers: {
        'User-Agent': 'GTF-Next/1.0',
      },
      next: {
        revalidate: 86400, // Cache for 24 hours
      },
    })

    if (!response.ok) {
      return new NextResponse('Image not found', { status: 404 })
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const buffer = await response.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    })
  } catch (error) {
    console.error('Image proxy error:', error)
    return new NextResponse('Failed to fetch image', { status: 500 })
  }
}
