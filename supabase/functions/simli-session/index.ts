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
    const { faceId, handleSilence = true, maxSessionLength = 600, maxIdleTime = 120 } = await req.json();
    const SIMLI_API_KEY = Deno.env.get('SIMLI_API_KEY');

    if (!SIMLI_API_KEY) {
      throw new Error('SIMLI_API_KEY is not configured');
    }

    console.log('Creating Simli session token for faceId:', faceId);

    // Create session token using Simli API
    const sessionResponse = await fetch('https://api.simli.ai/startAudioToVideoSession', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        faceId: faceId || 'tmp9i8bbq7c',
        isJPG: false,
        apiKey: SIMLI_API_KEY,
        syncAudio: true,
        handleSilence,
        maxSessionLength,
        maxIdleTime,
        model: 'fasttalk',
      }),
    });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.error('Simli session creation failed:', sessionResponse.status, errorText);
      throw new Error(`Simli API error: ${sessionResponse.status}`);
    }

    const sessionData = await sessionResponse.json();
    console.log('Session token created:', sessionData);

    return new Response(JSON.stringify({
      session_token: sessionData.session_token,
      apiKey: SIMLI_API_KEY,
      faceId: faceId || 'tmp9i8bbq7c',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Session error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
