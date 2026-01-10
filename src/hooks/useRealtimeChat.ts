import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UseRealtimeChatOptions {
  characterId: string;
  topicId: string;
  onTranscript?: (text: string, role: 'user' | 'assistant') => void;
  onSpeakingChange?: (speaking: boolean) => void;
}

export function useRealtimeChat({
  characterId,
  topicId,
  onTranscript,
  onSpeakingChange,
}: UseRealtimeChatOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      console.log('Realtime event:', data.type);

      switch (data.type) {
        case 'response.audio.delta':
          setIsSpeaking(true);
          onSpeakingChange?.(true);
          break;
        case 'response.audio.done':
          setIsSpeaking(false);
          onSpeakingChange?.(false);
          break;
        case 'response.audio_transcript.done':
          if (data.transcript) {
            onTranscript?.(data.transcript, 'assistant');
          }
          break;
        case 'conversation.item.input_audio_transcription.completed':
          if (data.transcript) {
            onTranscript?.(data.transcript, 'user');
          }
          break;
        case 'error':
          console.error('Realtime error:', data.error);
          toast({
            variant: 'destructive',
            title: '오류 발생',
            description: data.error?.message || '알 수 없는 오류',
          });
          break;
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }, [onTranscript, onSpeakingChange]);

  const connect = useCallback(async () => {
    if (isConnected || isConnecting) return;

    setIsConnecting(true);
    try {
      // Get ephemeral token from edge function
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke(
        'openai-realtime-token',
        {
          body: { character: characterId, topic: topicId }
        }
      );

      if (tokenError || !tokenData?.client_secret?.value) {
        throw new Error('Failed to get ephemeral token');
      }

      const EPHEMERAL_KEY = tokenData.client_secret.value;
      console.log('Got ephemeral token');

      // Create peer connection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Set up remote audio
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      audioElRef.current = audioEl;
      
      pc.ontrack = (e) => {
        console.log('Got remote track');
        audioEl.srcObject = e.streams[0];
      };

      // Add local audio track
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      streamRef.current = stream;
      pc.addTrack(stream.getTracks()[0]);
      console.log('Added local audio track');

      // Set up data channel
      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;
      
      dc.onopen = () => {
        console.log('Data channel opened');
        // Send session update to enable input audio transcription
        dc.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            input_audio_transcription: {
              model: 'whisper-1',
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 800,
            },
          }
        }));
      };
      
      dc.onmessage = handleMessage;

      // Create and set local description
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Connect to OpenAI's Realtime API
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp",
        },
      });

      if (!sdpResponse.ok) {
        throw new Error(`SDP exchange failed: ${sdpResponse.status}`);
      }

      const answer = {
        type: "answer" as RTCSdpType,
        sdp: await sdpResponse.text(),
      };
      
      await pc.setRemoteDescription(answer);
      console.log('WebRTC connection established');

      setIsConnected(true);
      toast({
        title: '🎤 실시간 대화 연결됨',
        description: '말씀하시면 AI가 바로 응답합니다.',
      });
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
  }, [characterId, topicId, isConnected, isConnecting, handleMessage]);

  const disconnect = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (dcRef.current) {
      dcRef.current.close();
      dcRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (audioElRef.current) {
      audioElRef.current.srcObject = null;
      audioElRef.current = null;
    }
    setIsConnected(false);
    setIsSpeaking(false);
    onSpeakingChange?.(false);
    console.log('Disconnected from realtime');
  }, [onSpeakingChange]);

  const sendTextMessage = useCallback((text: string) => {
    if (!dcRef.current || dcRef.current.readyState !== 'open') {
      console.error('Data channel not ready');
      return;
    }

    dcRef.current.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }],
      },
    }));
    dcRef.current.send(JSON.stringify({ type: 'response.create' }));
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
    sendTextMessage,
    audioElement: audioElRef.current,
  };
}
