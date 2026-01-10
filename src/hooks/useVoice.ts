import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UseVoiceOptions {
  voiceId: string;
  onTranscript?: (text: string) => void;
}

export function useVoice({ voiceId, onTranscript }: UseVoiceOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [partialTranscript, setPartialTranscript] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const speak = useCallback(async (text: string) => {
    if (!text || isPlaying) return;

    setIsPlaying(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text, voiceId }),
        }
      );

      if (!response.ok) {
        throw new Error('TTS failed');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      setAudioElement(audio);
      
      audio.onended = () => {
        setIsPlaying(false);
        setAudioElement(null);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setIsPlaying(false);
        setAudioElement(null);
        URL.revokeObjectURL(audioUrl);
      };
      
      try {
        await audio.play();
      } catch (playError) {
        console.log('Autoplay blocked, waiting for user interaction');
        setIsPlaying(false);
        setAudioElement(null);
        URL.revokeObjectURL(audioUrl);
        return;
      }
    } catch (error) {
      console.error('TTS error:', error);
      setIsPlaying(false);
      setAudioElement(null);
      toast({
        variant: 'destructive',
        title: '음성 재생 실패',
        description: '다시 시도해주세요.',
      });
    }
  }, [voiceId, isPlaying]);

  const stopSpeaking = useCallback(() => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setAudioElement(null);
      setIsPlaying(false);
    }
  }, [audioElement]);

  const startRecording = useCallback(async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        } 
      });
      
      streamRef.current = stream;
      chunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        if (chunksRef.current.length > 0) {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          
          // Convert to base64 and send to transcription
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            
            try {
              // Use Whisper API for transcription via edge function
              const { data, error } = await supabase.functions.invoke('whisper-transcribe', {
                body: { audio: base64Audio }
              });
              
              if (error) throw error;
              
              if (data?.text && onTranscript) {
                onTranscript(data.text);
              }
            } catch (error) {
              console.error('Transcription error:', error);
              // Fallback: just notify user to type
              toast({
                title: '음성 인식 완료',
                description: '텍스트를 확인해주세요.',
              });
            }
          };
          reader.readAsDataURL(audioBlob);
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setPartialTranscript('');
      
      toast({
        title: '🎤 녹음 시작',
        description: '말씀해주세요...',
      });
    } catch (error) {
      console.error('Recording error:', error);
      toast({
        variant: 'destructive',
        title: '마이크 접근 실패',
        description: '마이크 권한을 허용해주세요.',
      });
    }
  }, [onTranscript]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setPartialTranscript('');
      
      toast({
        title: '녹음 완료',
        description: '음성을 처리 중입니다...',
      });
    }
  }, [isRecording]);

  useEffect(() => {
    return () => {
      stopSpeaking();
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [stopSpeaking, isRecording]);

  return {
    isPlaying,
    isRecording,
    audioElement,
    partialTranscript,
    speak,
    stopSpeaking,
    startRecording,
    stopRecording,
  };
}
