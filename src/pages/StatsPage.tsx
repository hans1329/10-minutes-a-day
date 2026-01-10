import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Flame, BookOpen, BarChart3, Calendar, Clock, MessageSquare, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DayStats {
  date: string;
  sessionCount: number;
  durationMinutes: number;
}

interface Stats {
  totalSessions: number;
  totalMinutes: number;
  totalExpressions: number;
  currentStreak: number;
  longestStreak: number;
  dailyStats: DayStats[];
}

export default function StatsPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalSessions: 0,
    totalMinutes: 0,
    totalExpressions: 0,
    currentStreak: 0,
    longestStreak: 0,
    dailyStats: [],
  });

  useEffect(() => {
    // Load stats from localStorage
    const savedStats = localStorage.getItem('learning_stats');
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    } else {
      // Sample data for demonstration
      const sampleStats: Stats = {
        totalSessions: 12,
        totalMinutes: 95,
        totalExpressions: 28,
        currentStreak: 3,
        longestStreak: 7,
        dailyStats: generateSampleDailyStats(),
      };
      setStats(sampleStats);
    }
  }, []);

  const generateSampleDailyStats = (): DayStats[] => {
    const days: DayStats[] = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const hasStudied = Math.random() > 0.4;
      
      days.push({
        date: date.toISOString().split('T')[0],
        sessionCount: hasStudied ? Math.floor(Math.random() * 3) + 1 : 0,
        durationMinutes: hasStudied ? Math.floor(Math.random() * 20) + 5 : 0,
      });
    }
    
    return days;
  };

  const getWeekdayLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[date.getDay()];
  };

  const getIntensityClass = (minutes: number) => {
    if (minutes === 0) return 'bg-secondary';
    if (minutes < 5) return 'bg-primary/30';
    if (minutes < 10) return 'bg-primary/60';
    return 'bg-primary';
  };

  // Get last 4 weeks for calendar
  const last4Weeks = stats.dailyStats.slice(-28);
  const weeks: DayStats[][] = [];
  for (let i = 0; i < 4; i++) {
    weeks.push(last4Weeks.slice(i * 7, (i + 1) * 7));
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border p-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-center">📊 학습 통계</h1>
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto space-y-6">
        {/* Streak Card */}
        <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl p-6 border border-primary/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">현재 스트릭</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-primary">{stats.currentStreak}</span>
                <span className="text-lg text-foreground">일</span>
              </div>
            </div>
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Flame className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-primary/20">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Award className="w-4 h-4" />
              <span>최고 기록: {stats.longestStreak}일</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-xl p-4 border border-border text-center">
            <MessageSquare className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.totalSessions}</p>
            <p className="text-xs text-muted-foreground">총 대화</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border text-center">
            <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.totalMinutes}</p>
            <p className="text-xs text-muted-foreground">총 시간(분)</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border text-center">
            <BookOpen className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.totalExpressions}</p>
            <p className="text-xs text-muted-foreground">배운 표현</p>
          </div>
        </div>

        {/* Activity Calendar */}
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">학습 활동</h2>
          </div>
          
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map(day => (
              <div key={day} className="text-center text-xs text-muted-foreground">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="space-y-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={cn(
                      'aspect-square rounded-md',
                      getIntensityClass(day.durationMinutes)
                    )}
                    title={`${day.date}: ${day.durationMinutes}분`}
                  />
                ))}
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
            <span>적음</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-secondary" />
              <div className="w-3 h-3 rounded-sm bg-primary/30" />
              <div className="w-3 h-3 rounded-sm bg-primary/60" />
              <div className="w-3 h-3 rounded-sm bg-primary" />
            </div>
            <span>많음</span>
          </div>
        </div>

        {/* Weekly Goal */}
        <div className="bg-card rounded-2xl p-4 border border-border">
          <h2 className="font-semibold mb-3">이번 주 목표</h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>대화 횟수</span>
                <span className="text-primary">5/7회</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '71%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>학습 시간</span>
                <span className="text-primary">45/70분</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '64%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Button
          onClick={() => navigate('/')}
          className="w-full rounded-full h-12"
        >
          오늘의 학습 시작하기 🚀
        </Button>
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
            className="flex-1 flex flex-col items-center py-3 text-muted-foreground hover:text-primary transition-colors"
          >
            <BookOpen className="w-6 h-6" />
            <span className="text-xs mt-1">복습</span>
          </button>
          <button
            onClick={() => navigate('/stats')}
            className="flex-1 flex flex-col items-center py-3 text-primary"
          >
            <BarChart3 className="w-6 h-6" />
            <span className="text-xs mt-1">통계</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
