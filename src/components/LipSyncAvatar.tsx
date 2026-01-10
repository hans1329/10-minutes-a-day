import { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface LipSyncAvatarProps {
  avatarImage?: string;
  color?: string;
  audioElement?: HTMLAudioElement | null;
  isPlaying: boolean;
}

export function LipSyncAvatar({ 
  avatarImage, 
  color, 
  audioElement,
  isPlaying 
}: LipSyncAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const [mouthOpenness, setMouthOpenness] = useState(0);

  // Load avatar image
  useEffect(() => {
    if (avatarImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageRef.current = img;
        drawFrame(0);
      };
      img.src = avatarImage;
    }
  }, [avatarImage]);

  // Setup audio analysis
  useEffect(() => {
    if (!audioElement || !isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setMouthOpenness(0);
      return;
    }

    const setupAudioAnalysis = async () => {
      try {
        // Create audio context if not exists
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const audioContext = audioContextRef.current;

        // Resume if suspended
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        // Create source only once per audio element
        if (!sourceRef.current) {
          sourceRef.current = audioContext.createMediaElementSource(audioElement);
          analyserRef.current = audioContext.createAnalyser();
          analyserRef.current.fftSize = 256;
          analyserRef.current.smoothingTimeConstant = 0.3;
          
          sourceRef.current.connect(analyserRef.current);
          analyserRef.current.connect(audioContext.destination);
        }

        // Start animation loop
        const animate = () => {
          if (!analyserRef.current) return;

          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);

          // Calculate average volume in speech frequency range (300Hz - 3400Hz)
          const speechRange = dataArray.slice(2, 40);
          const avgVolume = speechRange.reduce((a, b) => a + b, 0) / speechRange.length;
          
          // Normalize to 0-1 range with some amplification
          const normalized = Math.min(1, (avgVolume / 128) * 1.5);
          setMouthOpenness(normalized);
          drawFrame(normalized);

          animationRef.current = requestAnimationFrame(animate);
        };

        animate();
      } catch (error) {
        console.error('Audio analysis setup failed:', error);
      }
    };

    setupAudioAnalysis();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioElement, isPlaying]);

  const drawFrame = useCallback((openness: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const img = imageRef.current;
    
    if (!canvas || !ctx || !img) return;

    const size = canvas.width;
    
    // Clear canvas
    ctx.clearRect(0, 0, size, size);
    
    // Draw circular clip path
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
    
    // Draw avatar image
    ctx.drawImage(img, 0, 0, size, size);
    
    // Draw mouth overlay (simple ellipse that changes with speech)
    if (openness > 0.1) {
      const mouthCenterX = size * 0.5;
      const mouthCenterY = size * 0.68;
      const mouthWidth = size * 0.15;
      const mouthHeight = size * 0.02 + (openness * size * 0.08);
      
      ctx.fillStyle = 'rgba(30, 20, 20, 0.8)';
      ctx.beginPath();
      ctx.ellipse(mouthCenterX, mouthCenterY, mouthWidth, mouthHeight, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner mouth highlight
      ctx.fillStyle = 'rgba(80, 30, 30, 0.6)';
      ctx.beginPath();
      ctx.ellipse(mouthCenterX, mouthCenterY - mouthHeight * 0.2, mouthWidth * 0.7, mouthHeight * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }, []);

  return (
    <div className={cn(
      'relative w-64 h-64 rounded-full overflow-hidden shadow-2xl',
      `bg-gradient-to-br ${color}`
    )}>
      <canvas
        ref={canvasRef}
        width={256}
        height={256}
        className="w-full h-full"
      />
      
      {/* Speaking indicator ring */}
      {isPlaying && (
        <div 
          className="absolute inset-0 rounded-full border-4 border-primary animate-pulse"
          style={{ 
            boxShadow: `0 0 ${20 + mouthOpenness * 30}px rgba(34, 197, 94, ${0.3 + mouthOpenness * 0.4})` 
          }}
        />
      )}
      
      {/* Audio wave visualization */}
      {isPlaying && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-end gap-0.5 h-8">
          {[...Array(7)].map((_, i) => (
            <span 
              key={i}
              className="w-1 bg-primary rounded-full transition-all duration-75"
              style={{ 
                height: `${8 + Math.sin((mouthOpenness * 10) + i * 0.8) * mouthOpenness * 24}px`,
                opacity: 0.6 + mouthOpenness * 0.4
              }} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
