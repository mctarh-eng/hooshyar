import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conversation = await db.conversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conversation) {
      return Response.json({ error: 'گفتگو پیدا نشد' }, { status: 404 });
    }
    return Response.json({
      id: conversation.id,
      title: conversation.title,
      providerId: conversation.providerId,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      messages: conversation.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        providerId: m.providerId,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error('conversation GET error:', e);
    return Response.json({ error: 'دریافت گفتگو ناموفق بود' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await req.json()) as { title?: string; providerId?: string };
    const data: { title?: string; providerId?: string } = {};
    if (typeof body.title === 'string' && body.title.trim()) {
      data.title = body.title.trim().slice(0, 80);
    }
    if (typeof body.providerId === 'string' && body.providerId) {
      data.providerId = body.providerId;
    }
    if (Object.keys(data).length === 0) {
      return Response.json({ error: 'چیزی برای تغییر نیست' }, { status: 400 });
    }
    await db.conversation.update({ where: { id }, data });
    return Response.json({ ok: true });
  } catch (e) {
    console.error('conversation PATCH error:', e);
    return Response.json({ error: 'تغییر ناموفق بود' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.conversation.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (e) {
    console.error('conversation DELETE error:', e);
    return Response.json({ error: 'حذف ناموفق بود' }, { status: 500 });
  }
}
