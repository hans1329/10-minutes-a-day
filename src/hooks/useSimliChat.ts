import { useState, useRef, useCallback, useEffect } from 'react';
import { SimliClient } from 'simli-client';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UseSimliChatOptions {
  faceId: string;
  onSpeakingChange?: (speaking: boolean) => void;
}

export function useSimliChat({
  faceId,
  onSpeakingChange,
}: UseSimliChatOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const simliClientRef = useRef<SimliClient | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Set up video/audio refs
  const setVideoRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
  }, []);

  const setAudioRef = useCallback((el: HTMLAudioElement | null) => {
    audioRef.current = el;
  }, []);

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
    try {
      // Get Simli session from edge function
      const { data: sessionData, error: sessionError } = await supabase.functions.invoke(
        'simli-session',
        {
          body: { faceId }
        }
      );

      if (sessionError || !sessionData?.session_token) {
        throw new Error('Failed to get Simli session: ' + (sessionError?.message || 'No session token'));
      }

      console.log('Got Simli session, initializing...');

      // Create Simli client
      const simliClient = new SimliClient();
      simliClientRef.current = simliClient;

      // Set up event listeners before initialize
      simliClient.on('connected', () => {
        console.log('Simli connected');
        setIsConnected(true);
      });

      simliClient.on('disconnected', () => {
        console.log('Simli disconnected');
        setIsConnected(false);
        setIsSpeaking(false);
        onSpeakingChange?.(false);
      });

      simliClient.on('speaking', () => {
        console.log('Avatar speaking');
        setIsSpeaking(true);
        onSpeakingChange?.(true);
      });

      simliClient.on('silent', () => {
        console.log('Avatar silent');
        setIsSpeaking(false);
        onSpeakingChange?.(false);
      });

      simliClient.on('failed', (reason) => {
        console.error('Simli failed:', reason);
        toast({
          variant: 'destructive',
          title: '연결 실패',
          description: reason || '다시 시도해주세요.',
        });
        setIsConnected(false);
        setIsConnecting(false);
      });

      // Configure Simli with proper config
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
      console.log('Simli initialized');

      // Start the session
      await simliClient.start();
      console.log('Simli session started');

      // Get microphone access and listen to it
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      streamRef.current = stream;
      console.log('Microphone access granted');

      // Use Simli's built-in method to listen to microphone
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        simliClient.listenToMediastreamTrack(audioTrack);
        console.log('Listening to microphone track');
      }

      setIsConnected(true);
      toast({
        title: '🎥 Simli 아바타 연결됨',
        description: '마이크로 대화하세요!',
      });

    } catch (error) {
      console.error('Error connecting to Simli:', error);
      toast({
        variant: 'destructive',
        title: '연결 실패',
        description: error instanceof Error ? error.message : '다시 시도해주세요.',
      });
    } finally {
      setIsConnecting(false);
    }
  }, [faceId, isConnected, isConnecting, onSpeakingChange]);

  const disconnect = useCallback(() => {
    // Stop microphone
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Close Simli client
    if (simliClientRef.current) {
      simliClientRef.current.close();
      simliClientRef.current = null;
    }

    setIsConnected(false);
    setIsSpeaking(false);
    onSpeakingChange?.(false);
    console.log('Disconnected from Simli');
  }, [onSpeakingChange]);

  // Send audio data (for TTS output from LLM)
  const sendAudio = useCallback((audioData: Uint8Array) => {
    if (simliClientRef.current && isConnected) {
      simliClientRef.current.sendAudioData(audioData);
    }
  }, [isConnected]);

  // Clear audio buffer (stop avatar from talking)
  const clearBuffer = useCallback(() => {
    if (simliClientRef.current) {
      simliClientRef.current.ClearBuffer();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isConnecting,
    isSpeaking,
    connect,
    disconnect,
    sendAudio,
    clearBuffer,
    setVideoRef,
    setAudioRef,
  };
}
