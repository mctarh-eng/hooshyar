import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const record = await db.generatedImage.findUnique({
      where: { id },
      select: { data: true },
    });
    if (!record) {
      return Response.json({ error: 'تصویر پیدا نشد' }, { status: 404 });
    }
    const base64 = record.data.replace(/^data:image\/\w+;base64,/, '');
    const bytes = Buffer.from(base64, 'base64');
    return new Response(new Uint8Array(bytes), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': bytes.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (e) {
    console.error('image [id] GET error:', e);
    return Response.json({ error: 'دریافت تصویر ناموفق بود' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.generatedImage.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (e) {
    console.error('image [id] DELETE error:', e);
    return Response.json({ error: 'حذف تصویر ناموفق بود' }, { status: 500 });
  }
}
