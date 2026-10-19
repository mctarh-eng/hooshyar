import { NextRequest } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';
import { getProvider, type AIProvider } from '@/lib/providers';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

interface ChatRequestBody {
  conversationId?: string | null;
  content?: string;
  providerId?: string;
}

function buildSystemPrompt(provider: AIProvider): string {
  return [
    'تو «هوش‌یار» هستی؛ دستیار هوشمند اپلیکیشن «هوش‌یار»، پلتفرم یکپارچه‌ی دسترسی آسان به هوش مصنوعی برای فارسی‌زبانان.',
    '',
    'قواعد پاسخ‌گویی:',
    '- همیشه به فارسی روان، ساده و دوستانه پاسخ بده؛ مگر اینکه کاربر صریحاً زبان دیگری بخواهد یا متن فنی به زبان دیگری لازم شود.',
    '- لحن گرم، صمیمی و پرانرژی داشته باش؛ مثل یک دوست باحال که خیلی چیزها بلد است.',
    '- پاسخ‌ها را خوانا و ساختارمند بده؛ در صورت نیاز از تیتر، لیست و جدول استفاده کن ولی زیاده‌روی نکن.',
    '- ایموجی را به‌اندازه و بجا استفاده کن.',
    '- اگر چیزی را نمی‌دانی صادقانه بگو و از حدس زدن پرهیز کن.',
    '- به اندازه‌ی سؤال کاربر کامل و مفید جواب بده؛ نه خیلی کوتاه نه بی‌دلیل طولانی.',
    '',
    'پروفایل دستیار فعال در این گفتگو:',
    `- نام: ${provider.name} (${provider.latinName})`,
    `- ویژگی: ${provider.tagline}`,
    `شخصیت ${provider.name}: ${provider.persona}`,
  ].join('\n');
}

type ZAIInstance = Awaited<ReturnType<typeof ZAI.create>>;

async function generateTitle(
  zai: ZAIInstance,
  userText: string,
  assistantText: string
): Promise<string | null> {
  try {
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content:
            'برای گفتگوی زیر یک عنوان کوتاه فارسی (حداکثر ۵ کلمه) بساز. فقط خود عنوان را برگردان؛ بدون هیچ توضیح اضافه، بدون علامت نقل‌قول و بدون ایموجی.',
        },
        {
          role: 'user',
          content: `پیام کاربر: ${userText.slice(0, 500)}\nپاسخ دستیار: ${assistantText.slice(0, 500)}`,
        },
      ],
      thinking: { type: 'disabled' },
    });
    const raw = completion.choices[0]?.message?.content?.trim() ?? '';
    const title = raw
      .replace(/^["'«»\s]+|["'«»\s.]+$/g, '')
      .split('\n')[0]
      .slice(0, 60)
      .trim();
    return title.length > 1 ? title : null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequestBody;
    const content = (body.content ?? '').toString().trim();
    if (!content) {
      return Response.json({ error: 'متن پیام خالی است' }, { status: 400 });
    }
    if (content.length > 8000) {
      return Response.json({ error: 'پیام خیلی طولانی است' }, { status: 400 });
    }
    const provider = getProvider(body.providerId ?? 'hooshyar');

    let conv: { id: string };
    if (body.conversationId) {
      const existing = await db.conversation.findUnique({
        where: { id: body.conversationId },
        select: { id: true },
      });
      if (!existing) {
        return Response.json({ error: 'گفتگو پیدا نشد' }, { status: 404 });
      }
      conv = existing;
    } else {
      conv = await db.conversation.create({
        data: { title: 'گفتگوی جدید', providerId: provider.id },
        select: { id: true },
      });
    }

    await db.message.create({
      data: {
        conversationId: conv.id,
        role: 'user',
        content,
        providerId: provider.id,
      },
    });

    const history = await db.message.findMany({
      where: { conversationId: conv.id },
      orderBy: { createdAt: 'asc' },
      take: 24,
    });
    const isFirstExchange = history.length === 1;

    const zai = await ZAI.create();
    const sdkMessages = [
      { role: 'assistant', content: buildSystemPrompt(provider) },
      ...history.map((m) => ({
        role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.content,
      })),
    ];

    const upstream = await zai.chat.completions.create({
      messages: sdkMessages,
      thinking: { type: 'disabled' },
      stream: true,
    } as never);

    const encoder = new TextEncoder();
    const conversationId = conv.id;

    const sse = new ReadableStream<Uint8Array>({
      start(controller) {
        // IMPORTANT: never await inside start() - returning a promise keeps the
        // stream "not started" and prevents chunks from flushing to the client.
        const pump = async () => {
          const send = (obj: unknown) => {
            try {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(obj)}\n\n`)
              );
            } catch {
              // client disconnected
            }
          };

          send({ meta: { conversationId, providerId: provider.id } });

          const decoder = new TextDecoder();
          let buffer = '';
          let full = '';

          try {
            for await (const bytes of upstream as unknown as AsyncIterable<Uint8Array>) {
              buffer += decoder.decode(bytes, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() ?? '';
              for (const line of lines) {
                const t = line.trim();
                if (!t.startsWith('data:')) continue;
                const payload = t.slice(5).trim();
                if (!payload || payload === '[DONE]') continue;
                try {
                  const json = JSON.parse(payload);
                  const delta = json?.choices?.[0]?.delta?.content ?? '';
                  if (delta) {
                    full += delta;
                    send({ delta });
                  }
                } catch {
                  // partial JSON chunk - skip
                }
              }
            }
          } catch (e) {
            console.error('chat upstream error:', e);
            if (!full) {
              send({
                error: 'در ساخت پاسخ مشکلی پیش آمد. لطفاً دوباره تلاش کن.',
              });
            }
          }

          if (full) {
            try {
              await db.message.create({
                data: {
                  conversationId,
                  role: 'assistant',
                  content: full,
                  providerId: provider.id,
                },
              });
            } catch (e) {
              console.error('save assistant message failed:', e);
            }
          }

          let title: string | null = null;
          if (isFirstExchange && full) {
            title = await generateTitle(zai, content, full);
            if (title) {
              try {
                await db.conversation.update({
                  where: { id: conversationId },
                  data: { title },
                });
              } catch {
                // non critical
              }
            }
          }

          try {
            await db.conversation.update({
              where: { id: conversationId },
              data: { providerId: provider.id },
            });
          } catch {
            // non critical
          }

          send({ done: true, conversationId, title });
        };

        void pump()
          .catch((e) => console.error('chat pump error:', e))
          .finally(() => {
            try {
              controller.close();
            } catch {
              // already closed
            }
          });
      },
      cancel() {
        // client disconnected - upstream iterator cleanup happens via GC
      },
    });

    return new Response(sse, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (e) {
    console.error('chat api error:', e);
    return Response.json(
      { error: 'ارتباط با هوش مصنوعی برقرار نشد. چند لحظه بعد دوباره تلاش کن.' },
      { status: 500 }
    );
  }
}
