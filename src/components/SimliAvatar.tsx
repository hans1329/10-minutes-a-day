import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface SimliAvatarProps {
  setVideoRef: (el: HTMLVideoElement | null) => void;
  setAudioRef: (el: HTMLAudioElement | null) => void;
  isConnected: boolean;
  isSpeaking: boolean;
  fallbackImage?: string;
  color?: string;
}

export function SimliAvatar({
  setVideoRef,
  setAudioRef,
  isConnected,
  isSpeaking,
  fallbackImage,
  color,
}: SimliAvatarProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    setVideoRef(videoRef.current);
    setAudioRef(audioRef.current);
  }, [setVideoRef, setAudioRef]);

  return (
    <div className={cn(
      'relative w-64 h-64 rounded-full overflow-hidden shadow-2xl',
      `bg-gradient-to-br ${color}`
    )}>
      {/* Fallback image when not connected */}
      {!isConnected && fallbackImage && (
        <img
          src={fallbackImage}
          alt="Avatar"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Simli video stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={false}
        className={cn(
          'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
          isConnected ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Hidden audio element for Simli audio */}
      <audio
        ref={audioRef}
        autoPlay
        className="hidden"
      />

      {/* Speaking indicator ring */}
      {isSpeaking && (
        <div 
          className="absolute inset-0 rounded-full border-4 border-primary animate-pulse"
          style={{ 
            boxShadow: `0 0 30px rgba(34, 197, 94, 0.5)` 
          }}
        />
      )}

      {/* Connection indicator */}
      {isConnected && (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 px-2 py-1 rounded-full">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-white">LIVE</span>
        </div>
      )}

      {/* Audio wave visualization when speaking */}
      {isSpeaking && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-end gap-0.5 h-8">
          {[...Array(7)].map((_, i) => (
            <span 
              key={i}
              className="w-1 bg-primary rounded-full animate-pulse"
              style={{ 
                height: `${8 + Math.sin(Date.now() / 100 + i * 0.8) * 12}px`,
                animationDelay: `${i * 0.1}s`,
              }} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
