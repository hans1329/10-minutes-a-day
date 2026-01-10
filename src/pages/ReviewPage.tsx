import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Flame, BookOpen, BarChart3, ChevronLeft, ChevronRight, RotateCcw, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MZExpression } from '@/types';
import { topics } from '@/data/topics';

interface SavedExpression extends MZExpression {
  id: string;
  learnedCount: number;
  lastReviewed?: string;
}

export default function ReviewPage() {
  const navigate = useNavigate();
  const [expressions, setExpressions] = useState<SavedExpression[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [mode, setMode] = useState<'flashcard' | 'quiz'>('flashcard');
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);

  useEffect(() => {
    // Load saved expressions or use sample data
    const saved = localStorage.getItem('learned_expressions');
    if (saved) {
      setExpressions(JSON.parse(saved));
    } else {
      // Use sample expressions from topics
      const sampleExpressions: SavedExpression[] = topics.flatMap(topic =>
        topic.expressions.map((exp, i) => ({
          ...exp,
          id: `${topic.id}-${i}`,
          learnedCount: 1,
        }))
      );
      setExpressions(sampleExpressions);
    }
  }, []);

  const currentExpression = expressions[currentIndex];

  const goNext = () => {
    setIsFlipped(false);
    setQuizAnswer(null);
    setCurrentIndex(prev => (prev + 1) % expressions.length);
  };

  const goPrev = () => {
    setIsFlipped(false);
    setQuizAnswer(null);
    setCurrentIndex(prev => (prev - 1 + expressions.length) % expressions.length);
  };

  const markAsKnown = () => {
    // Update learned count
    const updated = [...expressions];
    updated[currentIndex] = {
      ...updated[currentIndex],
      learnedCount: updated[currentIndex].learnedCount + 1,
      lastReviewed: new Date().toISOString(),
    };
    setExpressions(updated);
    localStorage.setItem('learned_expressions', JSON.stringify(updated));
    goNext();
  };

  const shuffleCards = () => {
    const shuffled = [...expressions].sort(() => Math.random() - 0.5);
    setExpressions(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const generateQuizOptions = () => {
    if (!currentExpression) return [];
    
    const correctAnswer = currentExpression.korean;
    const otherExpressions = expressions
      .filter(e => e.id !== currentExpression.id)
      .map(e => e.korean)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    return [...otherExpressions, correctAnswer].sort(() => Math.random() - 0.5);
  };

  const [quizOptions] = useState(() => generateQuizOptions());

  if (expressions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">아직 배운 표현이 없어요</h2>
          <p className="text-muted-foreground mb-4">친구와 대화하면서 표현을 배워보세요!</p>
          <Button onClick={() => navigate('/')} className="rounded-full">
            학습 시작하기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border p-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-center">📚 복습하기</h1>
          <div className="flex justify-center gap-2 mt-3">
            <Button
              variant={mode === 'flashcard' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('flashcard')}
              className="rounded-full"
            >
              플래시카드
            </Button>
            <Button
              variant={mode === 'quiz' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('quiz')}
              className="rounded-full"
            >
              퀴즈
            </Button>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto">
        {/* Progress */}
        <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
          <span>{currentIndex + 1} / {expressions.length}</span>
          <button onClick={shuffleCards} className="flex items-center gap-1 hover:text-primary">
            <RotateCcw className="w-4 h-4" />
            섞기
          </button>
        </div>

        {/* Flashcard Mode */}
        {mode === 'flashcard' && currentExpression && (
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className={cn(
              'relative w-full aspect-[3/4] cursor-pointer perspective-1000',
              'transition-transform duration-500 transform-style-preserve-3d',
              isFlipped && 'rotate-y-180'
            )}
          >
            {/* Front */}
            <div className={cn(
              'absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary/30',
              'flex flex-col items-center justify-center p-6 backface-hidden',
              isFlipped && 'invisible'
            )}>
              <p className="text-3xl font-bold text-center mb-4">{currentExpression.english}</p>
              <p className="text-sm text-muted-foreground">탭해서 뒤집기</p>
            </div>

            {/* Back */}
            <div className={cn(
              'absolute inset-0 rounded-3xl bg-card border-2 border-border',
              'flex flex-col items-center justify-center p-6 backface-hidden rotate-y-180',
              !isFlipped && 'invisible'
            )}>
              <p className="text-2xl font-bold text-center text-primary mb-4">{currentExpression.korean}</p>
              <div className="bg-secondary rounded-xl p-4 w-full">
                <p className="text-sm text-muted-foreground mb-1">예문:</p>
                <p className="text-foreground">{currentExpression.example}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quiz Mode */}
        {mode === 'quiz' && currentExpression && (
          <div className="space-y-4">
            <div className="rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary/30 p-8">
              <p className="text-2xl font-bold text-center">{currentExpression.english}</p>
              <p className="text-center text-muted-foreground mt-2">이 표현의 뜻은?</p>
            </div>

            <div className="space-y-2">
              {generateQuizOptions().map((option, i) => (
                <button
                  key={i}
                  onClick={() => setQuizAnswer(option)}
                  disabled={quizAnswer !== null}
                  className={cn(
                    'w-full p-4 rounded-xl text-left transition-all',
                    'border-2',
                    quizAnswer === null
                      ? 'border-border bg-card hover:border-primary/50'
                      : option === currentExpression.korean
                      ? 'border-primary bg-primary/20'
                      : quizAnswer === option
                      ? 'border-destructive bg-destructive/20'
                      : 'border-border bg-card opacity-50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {quizAnswer !== null && option === currentExpression.korean && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                    {quizAnswer === option && option !== currentExpression.korean && (
                      <X className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {quizAnswer && (
              <div className="bg-secondary rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-1">예문:</p>
                <p className="text-foreground">{currentExpression.example}</p>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            size="icon"
            onClick={goPrev}
            className="rounded-full w-12 h-12"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>

          {mode === 'flashcard' && isFlipped && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={goNext}
                className="rounded-full"
              >
                다시 볼게요
              </Button>
              <Button
                onClick={markAsKnown}
                className="rounded-full"
              >
                알아요! ✓
              </Button>
            </div>
          )}

          {mode === 'quiz' && quizAnswer && (
            <Button onClick={goNext} className="rounded-full">
              다음 문제
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={goNext}
            className="rounded-full w-12 h-12"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="max-w-lg mx-auto flex">
          <button
            onClick={() => navigate('/')}
            className="flex-1 flex flex-col items-center py-3 text-muted-foreground hover:text-primary transition-colors"
          >
            <Flame className="w-6 h-6" />
            <span className="text-xs mt-1">학습</span>
          </button>
          <button
            onClick={() => navigate('/review')}
            className="flex-1 flex flex-col items-center py-3 text-primary"
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
