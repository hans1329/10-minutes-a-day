import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { characters } from '@/data/characters';
import { topics } from '@/data/topics';
import { CharacterCard } from '@/components/CharacterCard';
import { TopicCard } from '@/components/TopicCard';
import { Button } from '@/components/ui/button';
import { ArrowRight, Flame, BookOpen, BarChart3 } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [step, setStep] = useState<'character' | 'topic'>('character');
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    // Load streak from localStorage
    const savedStreak = localStorage.getItem('learning_streak');
    if (savedStreak) {
      setStreak(parseInt(savedStreak, 10));
    }
  }, []);

  const handleStart = () => {
    if (selectedCharacter && selectedTopic) {
      navigate(`/chat?character=${selectedCharacter}&topic=${selectedTopic}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="p-4 pb-24 max-w-lg mx-auto">
        {/* Header */}
        <header className="text-center py-6">
          <h1 className="text-2xl font-bold text-foreground">
            🎯 하루 <span className="text-primary">10분</span> 영어
          </h1>
          <p className="text-muted-foreground mt-1">MZ 또래 친구와 트렌디한 영어 배우기</p>
          
          {/* Streak */}
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-card border border-border">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-medium">
              {streak > 0 ? `${streak}일 연속 학습 중!` : '오늘 첫 학습을 시작해보세요!'}
            </span>
          </div>
        </header>

        {/* Character Selection */}
        {step === 'character' && (
          <section className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-semibold text-foreground">👋 오늘 누구랑 수다 떨래?</h2>
            <div className="space-y-3">
              {characters.map(char => (
                <CharacterCard
                  key={char.id}
                  character={char}
                  isSelected={selectedCharacter === char.id}
                  onClick={() => setSelectedCharacter(char.id)}
                />
              ))}
            </div>
            <Button
              onClick={() => setStep('topic')}
              disabled={!selectedCharacter}
              className="w-full rounded-full h-12 text-base"
            >
              다음 <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </section>
        )}

        {/* Topic Selection */}
        {step === 'topic' && (
          <section className="space-y-4 animate-fade-in">
            <button
              onClick={() => setStep('character')}
              className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1"
            >
              ← 캐릭터 다시 선택
            </button>
            <h2 className="text-lg font-semibold text-foreground">💬 무슨 얘기 할까?</h2>
            <div className="space-y-3">
              {topics.map(topic => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  isSelected={selectedTopic === topic.id}
                  onClick={() => setSelectedTopic(topic.id)}
                />
              ))}
            </div>
            <Button
              onClick={handleStart}
              disabled={!selectedTopic}
              className="w-full rounded-full h-12 text-base"
            >
              대화 시작하기! 🎤
            </Button>
          </section>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="max-w-lg mx-auto flex">
          <button
            onClick={() => navigate('/learn')}
            className="flex-1 flex flex-col items-center py-3 text-primary"
          >
            <Flame className="w-6 h-6" />
            <span className="text-xs mt-1">학습</span>
          </button>
          <button
            onClick={() => navigate('/review')}
            className="flex-1 flex flex-col items-center py-3 text-muted-foreground hover:text-primary transition-colors"
          >
            <BookOpen className="w-6 h-6" />
            <span className="text-xs mt-1">복습</span>
          </button>
          <button
            onClick={() => navigate('/stats')}
            className="flex-1 flex flex-col items-center py-3 text-muted-foreground hover:text-primary transition-colors"
          >
            <BarChart3 className="w-6 h-6" />
            <span className="text-xs mt-1">통계</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
