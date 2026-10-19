import { NextRequest } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { text?: string };
    const text = (body.text ?? '').toString().trim();
    if (!text) {
      return Response.json({ error: 'متن خالی است' }, { status: 400 });
    }
    // TTS API limit is 1024 characters
    const clipped = text.slice(0, 1000);

    const zai = await ZAI.create();
    const response = await zai.audio.tts.create({
      input: clipped,
      voice: 'tongtong',
      speed: 1.0,
      response_format: 'wav',
      stream: false,
    });

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));
    if (buffer.length === 0) {
      throw new Error('empty audio');
    }

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (e) {
    console.error('tts api error:', e);
    return Response.json(
      { error: 'ساخت صدا ناموفق بود' },
      { status: 500 }
    );
  }
}
