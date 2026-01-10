import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Flame, Sparkles, Clock, Users } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const savedStreak = localStorage.getItem('learning_streak');
    if (savedStreak) {
      setStreak(parseInt(savedStreak, 10));
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        {/* Logo & Title */}
        <div className="mb-8">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🎯</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            10 Minutes a Day
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            MZ 또래 친구와 트렌디한 영어 배우기
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mb-8 max-w-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">하루 10분</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">AI 친구</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">MZ 슬랭</span>
          </div>
        </div>

        {/* Streak Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border mb-8">
          <Flame className="w-5 h-5 text-orange-500" />
          <span className="text-sm font-medium">
            {streak > 0 ? `${streak}일 연속 학습 중! 🔥` : '오늘 첫 학습을 시작해보세요!'}
          </span>
        </div>

        {/* CTA Button */}
        <Button
          onClick={() => navigate('/learn')}
          size="lg"
          className="w-full max-w-xs rounded-full h-14 text-lg font-semibold"
        >
          오늘의 학습 시작 ✨
        </Button>

        <p className="text-xs text-muted-foreground mt-4">
          매일 10분, 친구처럼 편하게 영어 배우기
        </p>
      </main>

      {/* Bottom Branding */}
      <footer className="p-6 text-center">
        <p className="text-xs text-muted-foreground">
          Powered by AI • Made for MZ Generation
        </p>
      </footer>
    </div>
  );
}
