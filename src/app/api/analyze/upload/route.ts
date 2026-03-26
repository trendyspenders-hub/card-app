import { NextRequest, NextResponse } from 'next/server';
import { generateImageKey } from '@/lib/r2';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];

const r2Configured =
  !!process.env.R2_ACCOUNT_ID &&
  !!process.env.R2_ACCESS_KEY_ID &&
  !!process.env.R2_SECRET_ACCESS_KEY;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const key = generateImageKey('cards/originals');

    let imageUrl: string;

    if (r2Configured) {
      // Production: upload to Cloudflare R2
      const { uploadImage } = await import('@/lib/r2');
      imageUrl = await uploadImage(buffer, key, file.type);
    } else {
      // Dev / no R2: store as base64 data URL so analysis still works
      const base64 = buffer.toString('base64');
      imageUrl = `data:${file.type};base64,${base64}`;
    }

    return NextResponse.json({ imageUrl, key, size: file.size, type: file.type });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload image. Please try again.' }, { status: 500 });
  }
}
