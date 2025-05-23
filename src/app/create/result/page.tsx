'use client';

import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { getAudioUrl } from '@/app/lib/api';

function ResultContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get('job_id');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      setError('No job ID found');
      setIsLoading(false);
      return;
    }

    // Get the audio URL for the job
    const fetchAudioUrl = async () => {
      try {
        setIsLoading(true);
        const url = getAudioUrl(jobId);
        
        if (!url) {
          setError('Audio file not found');
        } else {
          setAudioUrl(url);
        }
      } catch (error) {
        console.error('Error getting audio URL:', error);
        setError('Failed to get audio file');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAudioUrl();
  }, [jobId]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-purple-50 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-3xl font-bold text-red-600">Error</h1>
          <p className="text-gray-600 mt-4">{error}</p>
          <button
            onClick={() => window.location.href = '/create'}
            className="mt-6 bg-purple-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-purple-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-purple-800 mb-4">Loading your voice message...</h2>
          <div className="flex justify-center space-x-2">
            <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full mx-4"
      >
        <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Your Voice Message is Ready!
        </h1>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="text-center mb-4">
            <div className="w-24 h-24 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"></path>
              </svg>
            </div>
            <p className="text-gray-700 mb-2">Your voice has been successfully cloned!</p>
            <p className="text-sm text-gray-500">Listen to your message below</p>
          </div>
          
          <div className="flex justify-center mb-6">
            <div className="w-1 h-8 mx-1 bg-purple-600 rounded-full" />
            <div className="w-1 h-8 mx-1 bg-purple-600 rounded-full" />
            <div className="w-1 h-8 mx-1 bg-purple-600 rounded-full" />
            <div className="w-1 h-8 mx-1 bg-pink-600 rounded-full" />
            <div className="w-1 h-8 mx-1 bg-pink-600 rounded-full" />
          </div>
          
          {audioUrl && (
            <div className="mt-4">
              <audio controls className="w-full mb-6">
                <source src={audioUrl} type="audio/wav" />
                Your browser does not support the audio element.
              </audio>
              
              <div className="flex justify-center mt-6">
                <a 
                  href={audioUrl} 
                  download="your-cloned-voice.wav"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:scale-105 transition-transform flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path>
                  </svg>
                  Download Audio
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={() => window.location.href = '/create'}
            className="bg-gray-100 text-gray-700 font-semibold py-3 px-8 rounded-lg shadow-lg hover:bg-gray-200 transition-colors"
          >
            Create New
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResultContent />
    </Suspense>
  );
}
