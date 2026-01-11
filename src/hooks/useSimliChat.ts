import { useState, useRef, useCallback, useEffect } from 'react';
import { SimliClient } from 'simli-client';
import { useScribe, CommitStrategy } from '@elevenlabs/react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface UseSimliChatOptions {
  characterId: string;
  topicId: string;
  faceId: string;
  voiceId: string;
  onTranscript?: (text: string, role: 'user' | 'assistant') => void;
  onSpeakingChange?: (speaking: boolean) => void;
}

export function useSimliChat({
  characterId,
  topicId,
  faceId,
  voiceId,
  onTranscript,
  onSpeakingChange,
}: UseSimliChatOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const simliClientRef = useRef<SimliClient | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesRef = useRef<Message[]>([]);

  // Set up video/audio refs
  const setVideoRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
  }, []);

  const setAudioRef = useCallback((el: HTMLAudioElement | null) => {
    audioRef.current = el;
  }, []);

  // Trigger initial greeting from character when session starts
  const triggerInitialGreeting = useCallback(async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    console.log('Triggering initial greeting...');

    try {
      // Call AI with empty messages to trigger greeting
      const { data, error } = await supabase.functions.invoke('simli-chat', {
        body: {
          messages: [],
          characterId,
          voiceId,
          topicId,
          isGreeting: true,
        },
      });

      if (error) throw error;

      const { text: aiText, audioBase64 } = data;
      console.log('Character greeting:', aiText);

      // Add assistant message to history
      messagesRef.current.push({ role: 'assistant', content: aiText });
      onTranscript?.(aiText, 'assistant');

      // Send audio to Simli for lip-sync
      if (simliClientRef.current && audioBase64) {
        const binaryString = atob(audioBase64);
        const audioData = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          audioData[i] = binaryString.charCodeAt(i);
        }

        console.log('Sending greeting audio to Simli, size:', audioData.length);
        setIsSpeaking(true);
        onSpeakingChange?.(true);
        
        simliClientRef.current.sendAudioData(audioData);

        const durationMs = (audioData.length / 32000) * 1000;
        setTimeout(() => {
          setIsSpeaking(false);
          onSpeakingChange?.(false);
        }, durationMs + 500);
      }
    } catch (error) {
      console.error('Error triggering greeting:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [characterId, topicId, voiceId, isProcessing, onTranscript, onSpeakingChange]);

  // Process user speech and get AI response
  const processUserSpeech = useCallback(async (userText: string) => {
    if (!userText.trim() || isProcessing) return;

    setIsProcessing(true);
    console.log('Processing user speech:', userText);

    // Add user message to history
    messagesRef.current.push({ role: 'user', content: userText });
    onTranscript?.(userText, 'user');

    try {
      // Get AI response with TTS audio
      const { data, error } = await supabase.functions.invoke('simli-chat', {
        body: {
          messages: messagesRef.current,
          characterId,
          voiceId,
          topicId,
        },
      });

      if (error) throw error;

      const { text: aiText, audioBase64 } = data;
      console.log('AI response:', aiText);

      // Add assistant message to history
      messagesRef.current.push({ role: 'assistant', content: aiText });
      onTranscript?.(aiText, 'assistant');

      // Send audio to Simli for lip-sync
      if (simliClientRef.current && audioBase64) {
        // Convert base64 to Uint8Array
        const binaryString = atob(audioBase64);
        const audioData = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          audioData[i] = binaryString.charCodeAt(i);
        }

        console.log('Sending audio to Simli, size:', audioData.length);
        setIsSpeaking(true);
        onSpeakingChange?.(true);
        
        // Send audio data to Simli
        simliClientRef.current.sendAudioData(audioData);

        // Estimate speaking duration based on audio length (16kHz PCM = 32000 bytes/sec)
        const durationMs = (audioData.length / 32000) * 1000;
        setTimeout(() => {
          setIsSpeaking(false);
          onSpeakingChange?.(false);
        }, durationMs + 500);
      }

    } catch (error) {
      console.error('Error processing speech:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: error instanceof Error ? error.message : 'AI 응답 생성 실패',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [characterId, topicId, voiceId, isProcessing, onTranscript, onSpeakingChange]);

  // ElevenLabs Scribe for real-time STT
  const scribe = useScribe({
    modelId: 'scribe_v2_realtime',
    commitStrategy: CommitStrategy.VAD,
    onCommittedTranscript: (data) => {
      console.log('User said:', data.text);
      if (data.text.trim()) {
        processUserSpeech(data.text);
      }
    },
  });

  const connect = useCallback(async () => {
    if (isConnected || isConnecting) return;
    if (!videoRef.current || !audioRef.current) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '비디오/오디오 요소가 준비되지 않았습니다.',
      });
      return;
    }

    setIsConnecting(true);
    messagesRef.current = [];

    try {
      // Step 1: Get Simli session
      const { data: sessionData, error: sessionError } = await supabase.functions.invoke(
        'simli-session',
        { body: { faceId } }
      );

      if (sessionError || !sessionData?.session_token) {
        throw new Error('Failed to get Simli session');
      }

      console.log('Got Simli session');

      // Step 2: Get ElevenLabs Scribe token
      const { data: scribeData, error: scribeError } = await supabase.functions.invoke(
        'elevenlabs-scribe-token'
      );

      if (scribeError) {
        // Surface the real HTTP status/body (e.g. 401) instead of hiding it.
        throw new Error(scribeError.message);
      }

      if (!scribeData?.token) {
        throw new Error('Scribe token is missing from response');
      }

      console.log('Got Scribe token');

      // Step 3: Initialize Simli client
      const simliClient = new SimliClient();
      simliClientRef.current = simliClient;

      simliClient.on('connected', () => {
        console.log('Simli connected');
      });

      simliClient.on('disconnected', () => {
        console.log('Simli disconnected');
        setIsConnected(false);
        setIsSpeaking(false);
        onSpeakingChange?.(false);
      });

      simliClient.on('speaking', () => {
        setIsSpeaking(true);
        onSpeakingChange?.(true);
      });

      simliClient.on('silent', () => {
        setIsSpeaking(false);
        onSpeakingChange?.(false);
      });

      simliClient.on('failed', (reason) => {
        console.error('Simli failed:', reason);
        toast({
          variant: 'destructive',
          title: 'Simli 연결 실패',
          description: reason || '다시 시도해주세요.',
        });
      });

      const simliConfig = {
        apiKey: sessionData.apiKey,
        faceID: faceId,
        handleSilence: true,
        maxSessionLength: 600,
        maxIdleTime: 120,
        session_token: sessionData.session_token,
        videoRef: videoRef.current,
        audioRef: audioRef.current,
        enableConsoleLogs: true,
        SimliURL: 'https://api.simli.ai',
        maxRetryAttempts: 3,
        retryDelay_ms: 2000,
        videoReceivedTimeout: 15000,
        enableSFU: true,
        model: 'fasttalk' as const,
      };

      simliClient.Initialize(simliConfig);
      await simliClient.start();
      console.log('Simli started');

      // Step 4: Connect ElevenLabs Scribe for STT
      await scribe.connect({
        token: scribeData.token,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      console.log('Scribe connected');

      setIsConnected(true);
      toast({
        title: '🎥 실시간 아바타 대화 시작!',
        description: '캐릭터가 먼저 인사합니다.',
      });

      // Trigger initial greeting from character
      triggerInitialGreeting();

    } catch (error) {
      console.error('Error connecting:', error);
      toast({
        variant: 'destructive',
        title: '연결 실패',
        description: error instanceof Error ? error.message : '다시 시도해주세요.',
      });
    } finally {
      setIsConnecting(false);
    }
  }, [faceId, isConnected, isConnecting, scribe, onSpeakingChange]);

  const disconnect = useCallback(() => {
    // Disconnect Scribe
    scribe.disconnect();

    // Close Simli client
    if (simliClientRef.current) {
      simliClientRef.current.close();
      simliClientRef.current = null;
    }

    messagesRef.current = [];
    setIsConnected(false);
    setIsSpeaking(false);
    setIsProcessing(false);
    onSpeakingChange?.(false);
    console.log('Disconnected');
  }, [scribe, onSpeakingChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    isConnecting,
    isSpeaking,
    isProcessing,
    partialTranscript: scribe.partialTranscript,
    connect,
    disconnect,
    setVideoRef,
    setAudioRef,
  };
}
