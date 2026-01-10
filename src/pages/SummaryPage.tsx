import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getCharacterById } from '@/data/characters';
import { getTopicById } from '@/data/topics';
import { Button } from '@/components/ui/button';
import { Trophy, Flame, BookOpen, ArrowRight } from 'lucide-react';
import { MZExpression } from '@/types';

export default function SummaryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [learnedExpressions, setLearnedExpressions] = useState<MZExpression[]>([]);

  const characterId = searchParams.get('character') || 'jimin';
  const topicId = searchParams.get('topic') || 'cafe-restaurant';

  const character = getCharacterById(characterId);
  const topic = getTopicById(topicId);

  useEffect(() => {
    // Get expressions from the topic as "learned" for this session
    if (topic) {
      const randomExpressions = topic.expressions
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      setLearnedExpressions(randomExpressions);

      // Update streak
      const today = new Date().toISOString().split('T')[0];
      const lastStudyDate = localStorage.getItem('last_study_date');
      let streak = parseInt(localStorage.getItem('learning_streak') || '0', 10);

      if (lastStudyDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastStudyDate === yesterdayStr) {
          streak += 1;
        } else {
          streak = 1;
        }

        localStorage.setItem('learning_streak', streak.toString());
        localStorage.setItem('last_study_date', today);
      }

      // Save learned expressions
      const saved = localStorage.getItem('learned_expressions');
      const existing: MZExpression[] = saved ? JSON.parse(saved) : [];
      const updated = [...existing, ...randomExpressions.filter(
        exp => !existing.some(e => e.english === exp.english)
      )];
      localStorage.setItem('learned_expressions', JSON.stringify(updated));
    }
  }, [topic]);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto">
        {/* Celebration */}
        <div className="text-center py-8 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 animate-bounce-gentle">
            <Trophy className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">수고했어요! 🎉</h1>
          <p className="text-muted-foreground">
            {character?.nameKo}와의 대화가 끝났어요
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-card rounded-xl p-4 border border-border text-center">
            <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">10분</p>
            <p className="text-xs text-muted-foreground">대화 시간</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border text-center">
            <BookOpen className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{learnedExpressions.length}개</p>
            <p className="text-xs text-muted-foreground">배운 표현</p>
          </div>
        </div>

        {/* Learned Expressions */}
        <div className="bg-card rounded-2xl p-4 border border-border mb-6">
          <h2 className="font-semibold mb-4">📝 오늘 배운 표현</h2>
          <div className="space-y-3">
            {learnedExpressions.map((exp, i) => (
              <div key={i} className="bg-secondary rounded-xl p-3">
                <p className="font-medium text-primary">{exp.english}</p>
                <p className="text-sm text-foreground">{exp.korean}</p>
                <p className="text-xs text-muted-foreground mt-1">"{exp.example}"</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate('/review')}
            variant="outline"
            className="w-full rounded-full h-12"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            복습하러 가기
          </Button>
          <Button
            onClick={() => navigate('/')}
            className="w-full rounded-full h-12"
          >
            홈으로 돌아가기 <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
