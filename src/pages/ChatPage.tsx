import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getCharacterById } from '@/data/characters';
import { getTopicById } from '@/data/topics';
import { useChat } from '@/hooks/useChat';
import { useVoice } from '@/hooks/useVoice';
import { useTimer } from '@/hooks/useTimer';
import { ChatMessage } from '@/components/ChatMessage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, X, Clock, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ChatPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [showCharacter, setShowCharacter] = useState(true);
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
    duration: 600,
    onComplete: () => navigate(`/summary?character=${characterId}&topic=${topicId}`),
  });

  useEffect(() => {
    startConversation();
    timer.start();
  }, []);

  // Auto-speak new assistant messages
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        speak(lastMessage.content);
      }
    }
  }, [messages.length]);

  useEffect(() => {
    if (!showCharacter) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showCharacter]);

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
            {character?.avatarImage ? (
              <img 
                src={character.avatarImage} 
                alt={character.nameKo} 
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <span className="text-2xl">{character?.avatar}</span>
            )}
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
        <div className="max-w-lg mx-auto mt-2">
          <div className="h-1 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-1000"
              style={{ width: `${timer.progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Toggle Buttons */}
      <div className="sticky top-[76px] z-10 bg-background/80 backdrop-blur-lg px-4 py-2">
        <div className="max-w-lg mx-auto flex gap-2">
          <button
            onClick={() => setShowCharacter(false)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-full transition-all duration-300',
              !showCharacter 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            )}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm font-medium">대화</span>
          </button>
          <button
            onClick={() => setShowCharacter(true)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-full transition-all duration-300',
              showCharacter 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            )}
          >
            <User className="w-4 h-4" />
            <span className="text-sm font-medium">캐릭터</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-lg mx-auto">
          {showCharacter ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className={cn(
                'relative w-64 h-64 rounded-full overflow-hidden shadow-2xl',
                `bg-gradient-to-br ${character?.color}`
              )}>
                {character?.avatarImage ? (
                  <img 
                    src={character.avatarImage} 
                    alt={character.nameKo}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-8xl">
                    {character?.avatar}
                  </div>
                )}
                {/* Speaking indicator */}
                {isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="flex gap-1">
                      <span className="w-3 h-8 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                      <span className="w-3 h-12 bg-primary rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                      <span className="w-3 h-6 bg-primary rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                      <span className="w-3 h-10 bg-primary rounded-full animate-pulse" style={{ animationDelay: '450ms' }} />
                    </div>
                  </div>
                )}
              </div>
              <h2 className="mt-6 text-2xl font-bold text-foreground">{character?.nameKo}</h2>
              <p className="text-primary font-medium">{character?.personality}</p>
              <p className="mt-2 text-sm text-muted-foreground text-center max-w-xs">
                {character?.description}
              </p>
              <div className="mt-4 px-4 py-2 bg-secondary rounded-full">
                <span className="text-sm text-muted-foreground">주제: </span>
                <span className="text-sm font-medium text-foreground">{topic?.titleKo}</span>
              </div>
              
              {messages.length > 0 && messages[messages.length - 1].role === 'assistant' && (
                <div className="mt-6 p-4 bg-card border border-border rounded-2xl max-w-xs">
                  <p className="text-sm text-foreground line-clamp-3">
                    "{messages[messages.length - 1].content}"
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  characterEmoji={character?.avatar}
                  characterImage={character?.avatarImage}
                  onPlayAudio={msg.role === 'assistant' ? () => speak(msg.content) : undefined}
                  isPlaying={isPlaying}
                />
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                    {character?.avatarImage ? (
                      <img src={character.avatarImage} alt={character.nameKo} className="w-full h-full object-cover" />
                    ) : (
                      character?.avatar
                    )}
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
          )}
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
