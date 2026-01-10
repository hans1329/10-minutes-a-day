import { Character } from '@/types';
import avatarJimin from '@/assets/avatar-jimin.png';
import avatarMinwoo from '@/assets/avatar-minwoo.png';
import avatarSoyeon from '@/assets/avatar-soyeon.png';

export const characters: Character[] = [
  {
    id: 'jimin',
    name: 'Jimin',
    nameKo: '지민',
    personality: '텐션 높은 친구',
    description: '"헐 대박!" 리액션 좋고 에너지 넘치는 친구. 영어로 말하면 더 신나함!',
    avatar: '👩‍🦰',
    avatarImage: avatarJimin,
    voiceId: 'EXAVITQu4vr4xnSDxMaL', // Sarah - friendly female
    color: 'from-pink-500 to-rose-500',
  },
  {
    id: 'minwoo',
    name: 'Minwoo',
    nameKo: '민우',
    personality: '유머러스한 친구',
    description: '드립치면서 가르쳐주는 재밌는 친구. 영어 표현을 웃기게 설명함!',
    avatar: '😎',
    avatarImage: avatarMinwoo,
    voiceId: 'TX3LPaxmHKxFdv7VOQHJ', // Liam - casual male
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'soyeon',
    name: 'Soyeon',
    nameKo: '소연',
    personality: '차분한 친구',
    description: '조곤조곤 설명해주는 친절한 친구. 틀려도 안심시켜줌!',
    avatar: '🧑‍🎓',
    avatarImage: avatarSoyeon,
    voiceId: 'XrExE9yKIg1WjnnlVkGX', // Matilda - calm female
    color: 'from-purple-500 to-violet-500',
  },
];

export const getCharacterById = (id: string): Character | undefined => {
  return characters.find(char => char.id === id);
};
