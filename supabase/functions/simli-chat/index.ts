import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, characterId, voiceId, topicId } = await req.json();
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    // Character personalities for system prompt
    const characterPrompts: Record<string, string> = {
      jimin: "You are Jimin, an energetic and enthusiastic friend who loves to chat in English. You're always excited and use expressions like 'Oh wow!' and 'That's amazing!'. Keep responses short (1-3 sentences) and conversational.",
      minwoo: "You are Minwoo, a funny and humorous friend who teaches English through jokes and fun expressions. You often make puns and keep things light-hearted. Keep responses short (1-3 sentences) and conversational.",
      soyeon: "You are Soyeon, a calm and patient friend who explains things gently in English. You're encouraging and supportive, especially when someone makes mistakes. Keep responses short (1-3 sentences) and conversational.",
    };

    const systemPrompt = characterPrompts[characterId] || characterPrompts.jimin;
    const topicContext = topicId ? `The current conversation topic is about: ${topicId.replace(/-/g, ' ')}.` : '';

    console.log('Generating AI response for character:', characterId);

    // Step 1: Get AI response from OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: `${systemPrompt} ${topicContext}` },
          ...messages,
        ],
        max_tokens: 150,
        temperature: 0.8,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error('OpenAI error:', errorData);
      throw new Error('Failed to get AI response');
    }

    const openaiData = await openaiResponse.json();
    const aiText = openaiData.choices[0].message.content;
    console.log('AI response:', aiText);

    // Step 2: Convert text to speech using ElevenLabs (PCM format for Simli)
    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId || 'EXAVITQu4vr4xnSDxMaL'}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: aiText,
          model_id: 'eleven_turbo_v2_5',
          output_format: 'pcm_16000', // 16kHz PCM for Simli
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!ttsResponse.ok) {
      const errorData = await ttsResponse.text();
      console.error('ElevenLabs TTS error:', errorData);
      throw new Error('Failed to generate speech');
    }

    // Get audio as ArrayBuffer and convert to base64
    const audioBuffer = await ttsResponse.arrayBuffer();
    const uint8Array = new Uint8Array(audioBuffer);
    
    // Convert to base64
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, [...chunk]);
    }
    const audioBase64 = btoa(binary);

    console.log('Audio generated, size:', uint8Array.length, 'bytes');

    return new Response(JSON.stringify({
      text: aiText,
      audioBase64,
      audioFormat: 'pcm_16000',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Simli chat error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
