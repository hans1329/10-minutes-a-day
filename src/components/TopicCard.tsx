import { Topic } from '@/types';
import { cn } from '@/lib/utils';

interface TopicCardProps {
  topic: Topic;
  isSelected: boolean;
  onClick: () => void;
}

export function TopicCard({ topic, isSelected, onClick }: TopicCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-4 rounded-2xl border-2 transition-all duration-300',
        'hover:scale-[1.02] active:scale-[0.98]',
        isSelected
          ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
          : 'border-border bg-card hover:border-primary/50'
      )}
    >
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center text-2xl">
          {topic.icon}
        </div>
        <div className="flex-1 text-left">
          <h3 className="font-bold text-foreground">{topic.titleKo}</h3>
          <p className="text-sm text-muted-foreground">{topic.description}</p>
          <div className="flex gap-1 mt-2 flex-wrap">
            {topic.expressions.slice(0, 3).map((exp, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary"
              >
                {exp.english}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}
