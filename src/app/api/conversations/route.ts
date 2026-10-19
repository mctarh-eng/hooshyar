import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const conversations = await db.conversation.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 60,
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { messages: true } },
      },
    });

    const mapped = conversations.map((c) => ({
      id: c.id,
      title: c.title,
      providerId: c.providerId,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      lastMessage: c.messages[0]?.content?.slice(0, 140) ?? null,
      messageCount: c._count.messages,
    }));

    return Response.json({ conversations: mapped });
  } catch (e) {
    console.error('conversations GET error:', e);
    return Response.json(
      { error: 'دریافت گفتگوها ناموفق بود' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await db.message.deleteMany({});
    await db.conversation.deleteMany({});
    return Response.json({ ok: true });
  } catch (e) {
    console.error('conversations DELETE error:', e);
    return Response.json({ error: 'پاک‌سازی ناموفق بود' }, { status: 500 });
  }
}
