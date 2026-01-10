import { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AvatarVideoProps {
  avatarImage?: string;
  color?: string;
  isSpeaking: boolean;
  isConnected: boolean;
  onVideoRef: (video: HTMLVideoElement, audio: HTMLAudioElement) => void;
}

export function AvatarVideo({ 
  avatarImage, 
  color, 
  isSpeaking, 
  isConnected,
  onVideoRef 
}: AvatarVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (videoRef.current && audioRef.current) {
      onVideoRef(videoRef.current, audioRef.current);
    }
  }, [onVideoRef]);

  useEffect(() => {
    // Show video when connected and has video stream
    if (isConnected && videoRef.current) {
      const checkVideo = () => {
        if (videoRef.current && videoRef.current.videoWidth > 0) {
          setShowVideo(true);
        }
      };
      
      videoRef.current.addEventListener('loadeddata', checkVideo);
      const interval = setInterval(checkVideo, 500);
      
      return () => {
        clearInterval(interval);
        videoRef.current?.removeEventListener('loadeddata', checkVideo);
      };
    }
  }, [isConnected]);

  return (
    <div className={cn(
      'relative w-64 h-64 rounded-full overflow-hidden shadow-2xl',
      `bg-gradient-to-br ${color}`
    )}>
      {/* Static Avatar Image (shown when video not available) */}
      {avatarImage && !showVideo && (
        <img 
          src={avatarImage} 
          alt="Avatar"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      
      {/* Live Video Stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={cn(
          'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
          showVideo ? 'opacity-100' : 'opacity-0'
        )}
      />
      
      {/* Hidden Audio Element */}
      <audio ref={audioRef} autoPlay />
      
      {/* Speaking Indicator */}
      {isSpeaking && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <span 
              key={i}
              className="w-1.5 bg-primary rounded-full animate-pulse"
              style={{ 
                animationDelay: `${i * 100}ms`,
                height: `${Math.random() * 16 + 8}px`
              }} 
            />
          ))}
        </div>
      )}
      
      {/* Connection Status */}
      <div className={cn(
        'absolute top-3 right-3 w-3 h-3 rounded-full',
        isConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
      )} />
    </div>
  );
}
