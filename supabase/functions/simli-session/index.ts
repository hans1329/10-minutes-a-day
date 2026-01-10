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
    const { faceId } = await req.json();
    const SIMLI_API_KEY = Deno.env.get('SIMLI_API_KEY');

    if (!SIMLI_API_KEY) {
      throw new Error('SIMLI_API_KEY is not configured');
    }

    // Return the API key for client-side Simli SDK initialization
    // The Simli SDK handles session creation internally
    return new Response(JSON.stringify({
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
