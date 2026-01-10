import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getCharacterById } from '@/data/characters';
import { getTopicById } from '@/data/topics';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { useSimliChat } from '@/hooks/useSimliChat';
import { useTimer } from '@/hooks/useTimer';
import { Message } from '@/types';
import { ChatMessage } from '@/components/ChatMessage';
import { SimliAvatar } from '@/components/SimliAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, X, Clock, MessageCircle, User, Phone, PhoneOff, Video, VideoOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ChatPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [showCharacter, setShowCharacter] = useState(true);
  const [messages, setMessages] = useState<{id: number; role: 'user' | 'assistant'; content: string}[]>([]);
  const [messageIdCounter, setMessageIdCounter] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  const characterId = searchParams.get('character') || 'jimin';
  const topicId = searchParams.get('topic') || 'cafe-restaurant';

  const character = getCharacterById(characterId);
  const topic = getTopicById(topicId);

  // Handle transcript from realtime
  const handleTranscript = useCallback((text: string, role: 'user' | 'assistant') => {
    if (text.trim()) {
      setMessages(prev => [...prev, {
        id: messageIdCounter,
        role,
        content: text,
      }]);
      setMessageIdCounter(prev => prev + 1);
    }
  }, [messageIdCounter]);

  const [isSpeakingState, setIsSpeakingState] = useState(false);
  const [useSimliMode, setUseSimliMode] = useState(true); // Default to Simli avatar

  // OpenAI Realtime for voice chat (audio only mode)
  const { 
    isConnected: isRealtimeConnected, 
    isConnecting: isRealtimeConnecting, 
    isSpeaking: isRealtimeSpeaking,
    connect: connectRealtime, 
    disconnect: disconnectRealtime, 
    sendTextMessage,
  } = useRealtimeChat({
    characterId,
    topicId,
    onTranscript: handleTranscript,
    onSpeakingChange: setIsSpeakingState,
  });

  // Simli for avatar visualization
  const {
    isConnected: isSimliConnected,
    isConnecting: isSimliConnecting,
    isSpeaking: isSimliSpeaking,
    connect: connectSimli,
    disconnect: disconnectSimli,
    setVideoRef,
    setAudioRef,
  } = useSimliChat({
    faceId: character?.faceId || 'tmp9i8bbq7c',
    onSpeakingChange: setIsSpeakingState,
  });

  // Combined connection state
  const isConnected = useSimliMode ? isSimliConnected : isRealtimeConnected;
  const isConnecting = useSimliMode ? isSimliConnecting : isRealtimeConnecting;
  const isSpeaking = useSimliMode ? isSimliSpeaking : isRealtimeSpeaking;

  const connect = useCallback(() => {
    if (useSimliMode) {
      connectSimli();
    } else {
      connectRealtime();
    }
  }, [useSimliMode, connectSimli, connectRealtime]);

  const disconnect = useCallback(() => {
    disconnectSimli();
    disconnectRealtime();
  }, [disconnectSimli, disconnectRealtime]);

  const timer = useTimer({
    duration: 600,
    onComplete: () => {
      disconnect();
      navigate(`/summary?character=${characterId}&topic=${topicId}`);
    },
  });

  useEffect(() => {
    timer.start();
  }, []);

  useEffect(() => {
    if (!showCharacter) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showCharacter]);

  const handleSend = async () => {
    if (!inputText.trim() || !isRealtimeConnected) return;
    const text = inputText;
    setInputText('');
    
    // Add user message to UI
    setMessages(prev => [...prev, {
      id: messageIdCounter,
      role: 'user' as const,
      content: text,
    }]);
    setMessageIdCounter(prev => prev + 1);
    
    sendTextMessage(text);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCallToggle = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button onClick={() => {
            disconnect();
            navigate('/');
          }} className="text-muted-foreground hover:text-foreground">
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
            {isConnected && (
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
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
              {/* Simli Avatar */}
              <SimliAvatar
                setVideoRef={setVideoRef}
                setAudioRef={setAudioRef}
                isConnected={isSimliConnected}
                isSpeaking={isSpeakingState}
                fallbackImage={character?.avatarImage}
                color={character?.color}
              />
              
              <h2 className="mt-6 text-2xl font-bold text-foreground">{character?.nameKo}</h2>
              <p className="text-primary font-medium">{character?.personality}</p>
              <p className="mt-2 text-sm text-muted-foreground text-center max-w-xs">
                {character?.description}
              </p>
              <div className="mt-4 px-4 py-2 bg-secondary rounded-full">
                <span className="text-sm text-muted-foreground">주제: </span>
                <span className="text-sm font-medium text-foreground">{topic?.titleKo}</span>
              </div>
              
              {/* Mode Toggle */}
              <div className="mt-4 flex items-center gap-2">
                <Button
                  variant={useSimliMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (!isConnected) setUseSimliMode(true);
                  }}
                  disabled={isConnected}
                  className="rounded-full gap-1"
                >
                  <Video className="w-4 h-4" />
                  영상 아바타
                </Button>
                <Button
                  variant={!useSimliMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (!isConnected) setUseSimliMode(false);
                  }}
                  disabled={isConnected}
                  className="rounded-full gap-1"
                >
                  <Phone className="w-4 h-4" />
                  음성만
                </Button>
              </div>
              
              {/* Connection Status */}
              <div className="mt-6">
                {!isConnected ? (
                  <Button
                    onClick={handleCallToggle}
                    disabled={isConnecting}
                    size="lg"
                    className="rounded-full px-8 gap-2"
                  >
                    {isConnecting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        연결 중...
                      </>
                    ) : (
                      <>
                        {useSimliMode ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                        대화 시작
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleCallToggle}
                    variant="destructive"
                    size="lg"
                    className="rounded-full px-8 gap-2"
                  >
                    {useSimliMode ? <VideoOff className="w-5 h-5" /> : <PhoneOff className="w-5 h-5" />}
                    대화 종료
                  </Button>
                )}
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
                  isPlaying={isSpeaking && msg.id === messages[messages.length - 1]?.id}
                />
              ))}
              {messages.length === 0 && isConnected && (
                <div className="text-center text-muted-foreground py-8">
                  <p>마이크로 말씀해주세요! 🎤</p>
                  <p className="text-sm mt-2">AI가 실시간으로 응답합니다</p>
                </div>
              )}
              {messages.length === 0 && !isConnected && (
                <div className="text-center text-muted-foreground py-8">
                  <p>캐릭터 탭에서 "대화 시작" 버튼을 눌러주세요</p>
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
          {/* Call Toggle Button */}
          <Button
            onClick={handleCallToggle}
            disabled={isConnecting}
            size="icon"
            variant={isConnected ? "destructive" : "default"}
            className={cn(
              "rounded-full w-12 h-12 transition-all",
              isConnected && "animate-pulse"
            )}
          >
            {isConnecting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isConnected ? (
              <PhoneOff className="w-5 h-5" />
            ) : (
              <Phone className="w-5 h-5" />
            )}
          </Button>
          
          <Input
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isConnected ? "텍스트 입력 또는 마이크로 대화..." : "먼저 대화를 시작해주세요"}
            className="flex-1 rounded-full bg-secondary border-0"
            disabled={!isConnected}
          />
          
          <Button
            onClick={handleSend}
            disabled={!inputText.trim() || !isConnected}
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
