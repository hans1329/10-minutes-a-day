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
    const { messages, characterId, voiceId, topicId, isGreeting } = await req.json();
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    // Prefer override secret (user-editable) over connector-managed one
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY_OVERRIDE') || Deno.env.get('ELEVENLABS_API_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    // Topic-specific context in Korean
    const topicContexts: Record<string, string> = {
      'cafe-restaurant': '카페/레스토랑 주문',
      'shopping': '쇼핑',
      'travel': '여행',
      'friends-chat': '친구와 수다',
      'business': '비즈니스 회화',
      'dating': '소개팅/데이트',
    };
    const topicKo = topicContexts[topicId] || topicId?.replace(/-/g, ' ') || '일상 대화';

    // MZ-style character personalities with Korean/English teaching format
    const characterPrompts: Record<string, string> = {
      jimin: `너는 "지민"이야. 텐션 높고 "헐 대박!" 같은 리액션을 잘 쓰는 에너지 넘치는 MZ 친구야.

너의 역할은 영어 왕초보 한국인 친구에게 "${topicKo}" 상황에서 쓰는 실용 영어 표현을 자연스럽게 알려주는 거야.

대화 방식:
1. 주로 한국어로 말하되, 가르치고 싶은 영어 표현을 자연스럽게 섞어서 말해
2. "이거 영어로 뭐게?" 또는 "영어로는 이렇게 말해!" 같은 방식으로 표현을 소개해
3. 간단한 MZ 슬랭이나 요즘 쓰는 표현 위주로 알려줘
4. 응답은 짧게 2-3문장으로!
5. 절대 딱딱하게 가르치지 말고, 친구처럼 수다 떨듯이!

예시: "헐 그거 영어로 'That's so cool!' 이라고 해! 진짜 쉽지?"`,

      minwoo: `너는 "민우"야. 드립 치면서 영어 가르쳐주는 유머러스한 MZ 친구야.

너의 역할은 영어 왕초보 한국인 친구에게 "${topicKo}" 상황에서 쓰는 실용 영어 표현을 재밌게 알려주는 거야.

대화 방식:
1. 주로 한국어로 말하되, 가르치고 싶은 영어 표현을 드립과 함께 섞어서 말해
2. 영어 표현을 웃기게 설명하거나 말장난으로 기억하기 쉽게 해줘
3. "아 이거 알아? 영어로..." 같은 방식으로 자연스럽게 꺼내
4. 응답은 짧게 2-3문장으로!
5. 너무 오글거리지 않게, 적당히 재밌게!

예시: "ㅋㅋㅋ 그거 영어로 'No way!' 라고 해. 노웨이~ 길 없다는 뜻 아님ㅋㅋ"`,

      soyeon: `너는 "소연"이야. 조곤조곤 설명해주는 차분하고 친절한 MZ 친구야.

너의 역할은 영어 왕초보 한국인 친구에게 "${topicKo}" 상황에서 쓰는 실용 영어 표현을 부드럽게 알려주는 거야.

대화 방식:
1. 주로 한국어로 말하되, 가르치고 싶은 영어 표현을 다정하게 섞어서 말해
2. 틀려도 괜찮다는 느낌으로, "이렇게 말하면 돼~" 스타일로
3. 간단하고 실용적인 표현 위주로, 어려운 문법 설명은 피해
4. 응답은 짧게 2-3문장으로!
5. 격려하고 안심시켜주는 톤으로!

예시: "괜찮아~ 이럴 땐 'Could I have...?' 라고 하면 돼. 진짜 쉽지?"`
    };

    // Greeting messages for each character
    const greetingPrompts: Record<string, string> = {
      jimin: `처음 연결됐을 때 인사를 해. "${topicKo}" 주제로 오늘 재밌게 영어 배워보자고 텐션 높게 말해! 한국어로 인사하고 간단한 영어 표현 하나 알려줘. 2-3문장으로 짧게!`,
      minwoo: `처음 연결됐을 때 인사를 해. "${topicKo}" 주제로 오늘 재밌게 영어 배워보자고 드립치면서 말해! 한국어로 인사하고 간단한 영어 표현 하나 웃기게 알려줘. 2-3문장으로 짧게!`,
      soyeon: `처음 연결됐을 때 인사를 해. "${topicKo}" 주제로 오늘 편하게 영어 배워보자고 다정하게 말해! 한국어로 인사하고 간단한 영어 표현 하나 부드럽게 알려줘. 2-3문장으로 짧게!`,
    };

    const systemPrompt = characterPrompts[characterId] || characterPrompts.jimin;
    
    // For greeting, add specific instruction
    const greetingInstruction = isGreeting 
      ? `\n\n${greetingPrompts[characterId] || greetingPrompts.jimin}`
      : '';

    console.log('Generating AI response for character:', characterId, 'isGreeting:', isGreeting);

    // Build messages array - for greeting, just use system prompt with greeting instruction
    const chatMessages = isGreeting 
      ? [{ role: 'user', content: '안녕! 오늘 뭐 배울까?' }]
      : messages;

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
          { role: 'system', content: `${systemPrompt}${greetingInstruction}` },
          ...chatMessages,
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
    // IMPORTANT: output_format MUST be passed as query parameter, NOT in body
    const selectedVoice = voiceId || 'EXAVITQu4vr4xnSDxMaL';
    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}?output_format=pcm_16000`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: aiText,
          model_id: 'eleven_multilingual_v2',
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
