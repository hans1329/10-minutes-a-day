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
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const { character, topic } = await req.json();

    const characterPrompts: Record<string, string> = {
      jimin: `너는 지민이야. 텐션 높고 에너지 넘치는 친구야. "헐 대박!", "진짜?!", "완전!" 같은 리액션을 자주 해. 
      영어 표현을 알려줄 때 신나게 설명하고, 사용자가 잘하면 엄청 칭찬해줘.`,
      minwoo: `너는 민우야. 유머러스하고 드립을 잘 치는 친구야. 영어 표현을 재밌게 설명하고, 
      가끔 웃긴 예시를 들어줘. "ㅋㅋㅋ", "아 이거 웃기다" 같은 말을 자주 해.`,
      soyeon: `너는 소연이야. 차분하고 친절한 친구야. 조곤조곤 설명해주고, 틀려도 "괜찮아, 다시 해보자" 
      하면서 안심시켜줘. 정확하게 발음하는 법도 알려줘.`
    };

    const topicContext: Record<string, string> = {
      'cafe-restaurant': '카페나 맛집에서 쓸 수 있는 MZ 영어 표현들 (That\'s so fire!, I\'m lowkey obsessed, It hits different, No cap this slaps, I\'m dead 등)',
      'friends-chat': '친구들과 수다 떨 때 쓰는 MZ 영어 표현들 (Slay!, Bet, It\'s giving..., No way!, I can\'t even, Vibe check 등)',
      'shopping': '쇼핑이나 패션 얘기할 때 쓰는 MZ 영어 표현들 (This is a steal, Drip check, It\'s giving luxury, That\'s bussin\' 등)'
    };

    const instructions = `${characterPrompts[character] || characterPrompts.jimin}

오늘의 주제: ${topicContext[topic] || topicContext['cafe-restaurant']}

대화 규칙:
1. 한국어로 편하게 수다 떨다가 자연스럽게 영어 표현을 알려줘
2. "이거 영어로 뭐라고 하는지 알아?" 식으로 표현을 소개해
3. 북미 MZ세대가 진짜 쓰는 트렌디한 슬랭을 가르쳐줘
4. 표현을 알려줄 때는 발음 팁이나 사용 상황도 설명해줘
5. 사용자가 영어로 말하면 칭찬하고 피드백 해줘
6. 대화가 자연스럽게 흐르도록 해 - 딱딱한 수업 느낌 말고 친구랑 수다 떠는 느낌으로
7. 응답은 2-4문장으로 짧고 대화체로 해줘

중요: 너무 길게 설명하지 말고, 친구처럼 짧고 자연스럽게 대화해!`;

    // Request an ephemeral token from OpenAI
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "alloy",
        instructions,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI session error:", response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Session created:", data.id);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
