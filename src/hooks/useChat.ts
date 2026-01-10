import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types';
import { toast } from '@/hooks/use-toast';

interface UseChatOptions {
  characterId: string;
  topicId: string;
  onNewExpression?: (expression: { english: string; korean: string }) => void;
}

export function useChat({ characterId, topicId, onNewExpression }: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messageIdRef = useRef(0);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg-${++messageIdRef.current}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const chatMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke('mz-chat', {
        body: {
          messages: chatMessages,
          character: characterId,
          topic: topicId,
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: `msg-${++messageIdRef.current}`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Extract any English expressions mentioned
      const expressionMatch = data.message.match(/"([^"]+)"/g);
      if (expressionMatch && onNewExpression) {
        expressionMatch.forEach((match: string) => {
          const english = match.replace(/"/g, '');
          if (english.length > 3 && english.length < 50) {
            onNewExpression({ english, korean: '' });
          }
        });
      }

      return assistantMessage;
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        variant: 'destructive',
        title: '메시지 전송 실패',
        description: '다시 시도해주세요.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, characterId, topicId, isLoading, onNewExpression]);

  const startConversation = useCallback(async () => {
    setMessages([]);
    await sendMessage('안녕! 오늘 영어 좀 알려줘~');
  }, [sendMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    startConversation,
    clearMessages,
  };
}
