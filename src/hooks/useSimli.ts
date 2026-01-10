import { useState, useCallback, useRef, useEffect } from 'react';
import { SimliClient } from 'simli-client';
import { supabase } from '@/integrations/supabase/client';

interface UseSimliOptions {
  faceId: string;
  voiceId: string;
  onSpeakingChange?: (isSpeaking: boolean) => void;
}

export function useSimli({ faceId, voiceId, onSpeakingChange }: UseSimliOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const simliClientRef = useRef<SimliClient | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const initializeSimli = useCallback(async (
    videoElement: HTMLVideoElement,
    audioElement: HTMLAudioElement
  ) => {
    if (simliClientRef.current) {
      simliClientRef.current.close();
    }

    videoRef.current = videoElement;
    audioRef.current = audioElement;

    try {
      setIsLoading(true);
      
      // Get API key from edge function
      const { data, error } = await supabase.functions.invoke('simli-session', {
        body: { faceId }
      });

      if (error || !data?.apiKey) {
        console.error('Failed to get Simli API key:', error);
        return false;
      }

      const simliClient = new SimliClient();
      
      simliClient.Initialize({
        apiKey: data.apiKey,
        faceID: faceId,
        handleSilence: true,
        maxSessionLength: 3600,
        maxIdleTime: 600,
        session_token: '',
        videoRef: videoElement,
        audioRef: audioElement,
        enableConsoleLogs: true,
        SimliURL: '',
        maxRetryAttempts: 3,
        retryDelay_ms: 2000,
        videoReceivedTimeout: 15000,
        enableSFU: true,
        model: 'fasttalk',
      });

      simliClient.on('connected', () => {
        console.log('Simli connected');
        setIsConnected(true);
        setIsLoading(false);
      });

      simliClient.on('disconnected', () => {
        console.log('Simli disconnected');
        setIsConnected(false);
      });

      simliClient.on('failed', (reason) => {
        console.error('Simli failed:', reason);
        setIsConnected(false);
        setIsLoading(false);
      });

      simliClient.on('speaking', () => {
        setIsSpeaking(true);
        onSpeakingChange?.(true);
      });

      simliClient.on('silent', () => {
        setIsSpeaking(false);
        onSpeakingChange?.(false);
      });

      await simliClient.start();
      simliClientRef.current = simliClient;
      
      return true;
    } catch (error) {
      console.error('Failed to initialize Simli:', error);
      setIsLoading(false);
      return false;
    }
  }, [faceId, onSpeakingChange]);

  const speak = useCallback(async (text: string) => {
    if (!text) return;

    try {
      // Get audio from ElevenLabs TTS
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            text, 
            voiceId,
            outputFormat: 'pcm_16000' // PCM format for Simli
          }),
        }
      );

      if (!response.ok) {
        throw new Error('TTS failed');
      }

      // If Simli is connected, send audio to avatar
      if (simliClientRef.current && isConnected) {
        const arrayBuffer = await response.arrayBuffer();
        const audioData = new Uint8Array(arrayBuffer);
        simliClientRef.current.sendAudioData(audioData);
      } else {
        // Fallback: play audio directly
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.onended = () => URL.revokeObjectURL(audioUrl);
        await audio.play();
      }
    } catch (error) {
      console.error('Speak error:', error);
    }
  }, [voiceId, isConnected]);

  const close = useCallback(() => {
    if (simliClientRef.current) {
      simliClientRef.current.close();
      simliClientRef.current = null;
    }
    setIsConnected(false);
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    return () => {
      close();
    };
  }, [close]);

  return {
    isConnected,
    isSpeaking,
    isLoading,
    initializeSimli,
    speak,
    close,
    videoRef,
    audioRef,
  };
}
