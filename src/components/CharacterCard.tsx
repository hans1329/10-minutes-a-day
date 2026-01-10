import { Character } from '@/types';
import { cn } from '@/lib/utils';

interface CharacterCardProps {
  character: Character;
  isSelected: boolean;
  onClick: () => void;
}

export function CharacterCard({ character, isSelected, onClick }: CharacterCardProps) {
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
        <div
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center text-3xl',
            `bg-gradient-to-br ${character.color}`
          )}
        >
          {character.avatar}
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-foreground">{character.nameKo}</h3>
            <span className="text-sm text-muted-foreground">({character.name})</span>
          </div>
          <p className="text-sm text-primary font-medium">{character.personality}</p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {character.description}
          </p>
        </div>
        {isSelected && (
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
    </button>
  );
}
