import { Message } from '@/types';
import { cn } from '@/lib/utils';
import { Volume2 } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  characterEmoji?: string;
  onPlayAudio?: () => void;
  isPlaying?: boolean;
}

export function ChatMessage({ message, characterEmoji, onPlayAudio, isPlaying }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3 animate-fade-in',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0',
          isUser ? 'bg-primary' : 'bg-secondary'
        )}
      >
        {isUser ? '🙋' : characterEmoji || '🤖'}
      </div>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-md'
            : 'bg-card border border-border rounded-tl-md'
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        {!isUser && onPlayAudio && (
          <button
            onClick={onPlayAudio}
            disabled={isPlaying}
            className={cn(
              'mt-2 flex items-center gap-1 text-xs',
              isPlaying ? 'text-primary' : 'text-muted-foreground hover:text-primary'
            )}
          >
            <Volume2 className={cn('w-4 h-4', isPlaying && 'animate-pulse')} />
            {isPlaying ? '재생 중...' : '듣기'}
          </button>
        )}
      </div>
    </div>
  );
}
