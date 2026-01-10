import { Topic } from '@/types';

export const topics: Topic[] = [
  {
    id: 'cafe-restaurant',
    title: 'Cafe & Restaurant',
    titleKo: '카페 & 맛집',
    description: '카페 주문, 맛집 리뷰, 음식 표현',
    icon: '☕',
    expressions: [
      {
        english: "That's so fire!",
        korean: "완전 대박이야!",
        example: "This latte art is so fire!",
        category: "reaction"
      },
      {
        english: "I'm lowkey obsessed",
        korean: "은근히 빠져있어",
        example: "I'm lowkey obsessed with this cafe.",
        category: "feeling"
      },
      {
        english: "It hits different",
        korean: "뭔가 다르게 느껴져 / 특별해",
        example: "Coffee in the morning hits different.",
        category: "reaction"
      },
      {
        english: "No cap, this slaps",
        korean: "진짜로, 이거 대박이야",
        example: "No cap, this ramen slaps.",
        category: "reaction"
      },
      {
        english: "I'm dead",
        korean: "웃겨 죽겠어 / 감동이야",
        example: "This dessert is so good, I'm dead.",
        category: "reaction"
      }
    ]
  },
  {
    id: 'friends-chat',
    title: 'Chatting with Friends',
    titleKo: '친구들과 수다',
    description: '일상 안부, 리액션, SNS 스타일 표현',
    icon: '💬',
    expressions: [
      {
        english: "Slay!",
        korean: "완벽해! / 너무 잘했어!",
        example: "You got the job? Slay!",
        category: "compliment"
      },
      {
        english: "Bet",
        korean: "ㅇㅋ / 당연하지",
        example: "Wanna grab coffee? Bet.",
        category: "agreement"
      },
      {
        english: "It's giving...",
        korean: "~느낌이야",
        example: "Your outfit is giving main character energy.",
        category: "description"
      },
      {
        english: "No way!",
        korean: "헐 진짜?!",
        example: "You met BTS? No way!",
        category: "surprise"
      },
      {
        english: "I can't even",
        korean: "어이없어 / 말도 안돼",
        example: "He said that? I can't even.",
        category: "reaction"
      },
      {
        english: "Vibe check",
        korean: "분위기 어때? / 기분 어때?",
        example: "Hey, vibe check - how are you feeling?",
        category: "greeting"
      }
    ]
  },
  {
    id: 'shopping',
    title: 'Shopping & Fashion',
    titleKo: '쇼핑 & 패션',
    description: '쇼핑 표현, 패션 칭찬, 가격 흥정',
    icon: '🛍️',
    expressions: [
      {
        english: "This is a steal",
        korean: "이거 완전 득템이야",
        example: "50% off? This is a steal!",
        category: "shopping"
      },
      {
        english: "Drip check",
        korean: "옷 봐봐 / 스타일 체크",
        example: "Drip check! You look amazing.",
        category: "compliment"
      },
      {
        english: "It's giving luxury",
        korean: "고급스러워 보여",
        example: "That bag is giving luxury vibes.",
        category: "description"
      },
      {
        english: "That's bussin'",
        korean: "그거 진짜 좋아 / 대박이야",
        example: "Your new sneakers are bussin'!",
        category: "compliment"
      }
    ]
  }
];

export const getTopicById = (id: string): Topic | undefined => {
  return topics.find(topic => topic.id === id);
};
