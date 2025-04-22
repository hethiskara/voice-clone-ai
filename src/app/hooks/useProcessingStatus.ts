'use client';

import { useState, useEffect } from 'react';
import { ProcessingStatus } from '../types/api';

export function useProcessingStatus(jobId: string) {
  const [status, setStatus] = useState<ProcessingStatus>({
    status: 'training',
    progress: 0
  });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // This will be replaced with actual API call
        // Simulating progress for now
        setStatus(prev => {
          if (prev.status === 'completed' || prev.status === 'error') {
            return prev;
          }

          const newProgress = Math.min(prev.progress + 2, 100);
          const newStatus: ProcessingStatus = {
            status: newProgress < 50 ? 'training' : newProgress < 100 ? 'generating' : 'completed',
            progress: newProgress,
            estimatedTimeRemaining: Math.floor((100 - newProgress) / 2), // rough estimate in seconds
            message: newProgress < 50 
              ? 'Training voice model...'
              : newProgress < 100 
                ? 'Generating audio...'
                : 'Complete!',
            audioUrl: newProgress === 100 ? '/demo-output.mp3' : undefined
          };
          return newStatus;
        });
      } catch (_error) {
        setStatus({
          status: 'error',
          progress: 0,
          message: 'An error occurred while processing your request'
        });
      }
    };

    const interval = setInterval(checkStatus, 1000);
    return () => clearInterval(interval);
  }, [jobId]);

  return status;
}
