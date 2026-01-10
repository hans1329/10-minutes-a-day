export interface Character {
  id: string;
  name: string;
  nameKo: string;
  personality: string;
  description: string;
  avatar: string;
  avatarImage?: string;
  voiceId: string;
  faceId?: string;
  color: string;
}

export interface Topic {
  id: string;
  title: string;
  titleKo: string;
  description: string;
  icon: string;
  expressions: MZExpression[];
}

export interface MZExpression {
  english: string;
  korean: string;
  example: string;
  category: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

export interface LearningSession {
  id: string;
  characterId: string;
  topicId: string;
  durationSeconds: number;
  expressionsLearned: MZExpression[];
  createdAt: Date;
}

export interface LearnedExpression {
  id: string;
  english: string;
  korean: string;
  exampleSentence?: string;
  category: string;
  learnedCount: number;
  lastReviewedAt?: Date;
  createdAt: Date;
}

export interface LearningStats {
  totalSessions: number;
  totalDurationSeconds: number;
  totalExpressionsLearned: number;
  currentStreak: number;
  longestStreak: number;
}

export interface Attendance {
  date: string;
  sessionCount: number;
  totalDurationSeconds: number;
}
