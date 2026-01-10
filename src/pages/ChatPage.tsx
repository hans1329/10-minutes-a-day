import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getCharacterById } from '@/data/characters';
import { getTopicById } from '@/data/topics';
import { useChat } from '@/hooks/useChat';
import { useVoice } from '@/hooks/useVoice';
import { useTimer } from '@/hooks/useTimer';
import { ChatMessage } from '@/components/ChatMessage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Mic, MicOff, X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ChatPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const characterId = searchParams.get('character') || 'jimin';
  const topicId = searchParams.get('topic') || 'cafe-restaurant';

  const character = getCharacterById(characterId);
  const topic = getTopicById(topicId);

  const { messages, isLoading, sendMessage, startConversation } = useChat({
    characterId,
    topicId,
  });

  const { isPlaying, speak } = useVoice({
    voiceId: character?.voiceId || 'EXAVITQu4vr4xnSDxMaL',
  });

  const timer = useTimer({
    duration: 600, // 10 minutes
    onComplete: () => navigate(`/summary?character=${characterId}&topic=${topicId}`),
  });

  useEffect(() => {
    startConversation();
    timer.start();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');
    await sendMessage(text);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
            <X className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{character?.avatar}</span>
            <span className="font-medium">{character?.nameKo}</span>
          </div>
          <div className={cn(
            'flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium',
            timer.timeLeft < 60 ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'
          )}>
            <Clock className="w-4 h-4" />
            {timer.formattedTime}
          </div>
        </div>
        {/* Progress bar */}
        <div className="max-w-lg mx-auto mt-2">
          <div className="h-1 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-1000"
              style={{ width: `${timer.progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-lg mx-auto space-y-4">
          {messages.map((msg, index) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              characterEmoji={character?.avatar}
              onPlayAudio={msg.role === 'assistant' ? () => speak(msg.content) : undefined}
              isPlaying={isPlaying}
            />
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                {character?.avatar}
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-tl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <footer className="sticky bottom-0 bg-background border-t border-border p-4">
        <div className="max-w-lg mx-auto flex gap-2">
          <Input
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="메시지를 입력하세요..."
            className="flex-1 rounded-full bg-secondary border-0"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            size="icon"
            className="rounded-full w-12 h-12"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </footer>
    </div>
  );
}
