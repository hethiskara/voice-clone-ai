'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid';

interface AudioPlayerProps {
  audioUrl: string;
  onError?: (error: Error) => void;
}

export default function AudioPlayer({ audioUrl, onError }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const handleLoadedData = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = (e: ErrorEvent) => {
      console.error('Audio error:', e);
      setIsLoading(false);
      if (onError) {
        onError(new Error('Failed to load audio'));
      }
    };

    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
    };
  }, [audioUrl, onError]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-card p-4 transition-all duration-300 hover:shadow-card-hover">
      <div className="flex items-center justify-center mb-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={togglePlay}
          disabled={isLoading}
          className={`p-3 rounded-full ${isPlaying ? 'bg-primary-600' : 'bg-gradient-to-r from-primary-600 to-secondary-600'} text-white disabled:bg-gray-300 dark:disabled:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-300`}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <PauseIcon className="h-6 w-6" />
          ) : (
            <PlayIcon className="h-6 w-6" />
          )}
        </motion.button>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600 dark:text-gray-300 min-w-[40px] text-right">
          {formatTime(currentTime)}
        </span>
        <div className="relative flex-grow h-2 rounded-lg bg-gray-200 dark:bg-gray-700">
          <div 
            className="absolute top-0 left-0 h-full rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          ></div>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={handleSliderChange}
            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Audio progress"
          />
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-300 min-w-[40px]">
          {formatTime(duration)}
        </span>
      </div>
      
      {isLoading && (
        <div className="mt-2 flex justify-center">
          <div className="flex space-x-1">
            <div className="w-2 h-2 rounded-full bg-primary-400 animate-pulse"></div>
            <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 rounded-full bg-primary-600 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      )}
    </div>
  );
}
