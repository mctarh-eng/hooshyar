import { NextRequest } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 180;

type ZAIInstance = Awaited<ReturnType<typeof ZAI.create>>;

/**
 * The image service rejects Persian text, so we translate Persian prompts
 * into rich English prompts via the LLM first (also improves image quality).
 */
async function toEnglishPrompt(
  zai: ZAIInstance,
  prompt: string
): Promise<string> {
  if (!/[\u0600-\u06FF]/.test(prompt)) return prompt;
  try {
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content:
            'You are a professional text-to-image prompt engineer. Translate the following Persian description into one vivid, detailed ENGLISH image-generation prompt. Output ONLY the English prompt, nothing else. Include subject, mood, lighting and colors. Keep it tasteful and safe-for-work.',
        },
        { role: 'user', content: prompt.slice(0, 900) },
      ],
      thinking: { type: 'disabled' },
    });
    const out = completion.choices[0]?.message?.content?.trim();
    if (out && out.length > 3) return out.replace(/^["']|["']$/g, '').slice(0, 900);
  } catch {
    // fall back to the original prompt
  }
  return prompt;
}

const SUPPORTED_SIZES = [
  '1024x1024',
  '768x1344',
  '864x1152',
  '1344x768',
  '1152x864',
  '1440x720',
  '720x1440',
] as const;

export async function GET() {
  try {
    const images = await db.generatedImage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { id: true, prompt: true, size: true, style: true, createdAt: true },
    });
    return Response.json({
      images: images.map((i) => ({
        ...i,
        createdAt: i.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error('image GET error:', e);
    return Response.json({ error: 'دریافت تصاویر ناموفق بود' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      prompt?: string;
      size?: string;
      style?: string;
    };
    const prompt = (body.prompt ?? '').toString().trim();
    if (!prompt) {
      return Response.json({ error: 'توضیح تصویر خالی است' }, { status: 400 });
    }
    if (prompt.length > 1000) {
      return Response.json({ error: 'توضیح خیلی طولانی است' }, { status: 400 });
    }
    const size = SUPPORTED_SIZES.find((s) => s === body.size) ?? '1024x1024';
    const style = (body.style ?? '').toString().slice(0, 100);

    const zai = await ZAI.create();
    const englishPrompt = await toEnglishPrompt(zai, prompt);

    const finalPrompt = [englishPrompt, style, 'high quality, detailed']
      .filter(Boolean)
      .join(', ');

    const response = await zai.images.generations.create({
      prompt: finalPrompt,
      size,
    });

    const base64 = response.data?.[0]?.base64;
    if (!base64) {
      throw new Error('empty image response');
    }

    const record = await db.generatedImage.create({
      data: {
        prompt,
        size,
        style,
        data: `data:image/png;base64,${base64}`,
      },
      select: { id: true, prompt: true, size: true, style: true, createdAt: true },
    });

    return Response.json({
      id: record.id,
      prompt: record.prompt,
      size: record.size,
      style: record.style,
      createdAt: record.createdAt.toISOString(),
    });
  } catch (e) {
    console.error('image POST error:', e);
    return Response.json(
      { error: 'ساخت تصویر ناموفق بود. چند لحظه بعد دوباره امتحان کن.' },
      { status: 500 }
    );
  }
}
