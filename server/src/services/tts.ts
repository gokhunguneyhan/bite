import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const BUCKET = 'audio-summaries';
const VOICE = 'nova';
const MODEL = 'tts-1';

interface TTSRequest {
  summaryId: string;
  text: string;
  videoTitle: string;
}

interface TTSResult {
  audioUrl: string;
  durationEstimate: number;
  cached: boolean;
}

export async function getOrGenerateAudio(req: TTSRequest): Promise<TTSResult> {
  const storagePath = `${req.summaryId}.mp3`;

  // Check if audio already exists in Supabase Storage
  const { data: existing } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 3600);

  if (existing?.signedUrl) {
    return {
      audioUrl: existing.signedUrl,
      durationEstimate: Math.ceil(req.text.length / 15),
      cached: true,
    };
  }

  // Generate audio via OpenAI TTS
  const response = await openai.audio.speech.create({
    model: MODEL,
    voice: VOICE,
    input: req.text,
    response_format: 'mp3',
  });

  // Upload to Supabase Storage
  const buffer = Buffer.from(await response.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: 'audio/mpeg',
      upsert: true,
    });

  if (uploadError) {
    console.error('[tts] Upload error:', uploadError);
    throw new Error('Failed to store audio');
  }

  // Generate signed URL
  const { data: urlData, error: urlError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 3600);

  if (urlError || !urlData?.signedUrl) {
    throw new Error('Failed to generate audio URL');
  }

  return {
    audioUrl: urlData.signedUrl,
    durationEstimate: Math.ceil(req.text.length / 15),
    cached: false,
  };
}
