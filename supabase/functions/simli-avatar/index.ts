import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voiceId, faceId } = await req.json();
    const SIMLI_API_KEY = Deno.env.get('SIMLI_API_KEY');

    if (!SIMLI_API_KEY) {
      throw new Error('SIMLI_API_KEY is not configured');
    }

    // Get audio from ElevenLabs first
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId || 'EXAVITQu4vr4xnSDxMaL'}?output_format=pcm_16000`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error('ElevenLabs TTS error:', ttsResponse.status, errorText);
      throw new Error('TTS generation failed');
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

    // Generate lip-synced video with Simli
    const simliResponse = await fetch('https://api.simli.ai/audioToVideoStream', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SIMLI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio: audioBase64,
        faceId: faceId || 'default_face',
        audioFormat: 'pcm_16000',
      }),
    });

    if (!simliResponse.ok) {
      const errorText = await simliResponse.text();
      console.error('Simli error:', simliResponse.status, errorText);
      // Return just audio if Simli fails
      return new Response(JSON.stringify({ 
        audioBase64,
        videoUrl: null,
        error: 'Avatar generation failed, audio only'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const simliData = await simliResponse.json();

    return new Response(JSON.stringify({
      audioBase64,
      videoUrl: simliData.videoUrl,
      streamUrl: simliData.streamUrl,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Avatar error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
