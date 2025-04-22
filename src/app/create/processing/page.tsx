'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { checkJobStatus } from '@/app/lib/api';
import toast from 'react-hot-toast';

// Create a client component that uses useSearchParams
function ProcessingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const jobId = searchParams.get('job_id');
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Initializing...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      setError('No job ID provided');
      return;
    }

    // Set up polling to check job status
    const checkStatus = async () => {
      try {
        const response = await checkJobStatus(jobId);
        setStatus(response.status);
        setProgress(response.progress);
        setMessage(response.message);

        if (response.status === 'completed') {
          // Wait a moment before redirecting to ensure the audio is ready
          setTimeout(() => {
            router.push(`/create/result?job_id=${jobId}`);
          }, 1000);
        } else if (response.status === 'error') {
          setError(response.message);
        }
      } catch (error) {
        console.error('Error checking job status:', error);
        setError('Failed to check job status');
      }
    };

    // Initial check
    checkStatus();

    // Set up polling interval
    const intervalId = setInterval(checkStatus, 1000);

    // Clean up on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [jobId, router]);

  const handleRetry = () => {
    router.push('/create');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={handleRetry}
            className="bg-purple-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-purple-700"
          >
            Try Again
          </button>
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
          Processing Your Voice
        </h1>
        
        <div className="mb-8">
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-600 bg-purple-200">
                  {status || 'Processing...'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-purple-600">
                  {progress}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-purple-200">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-purple-500 to-pink-500"
              ></motion.div>
            </div>
          </div>
          
          <div className="text-center text-gray-600">
            <p className="mb-4">{message}</p>
            <div className="flex justify-center space-x-2 mt-6">
              <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">What's happening?</h2>
          <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2">
            <li>Analyzing your voice samples to extract unique characteristics</li>
            <li>Creating a voice profile based on pitch, tone, and speech patterns</li>
            <li>Generating new speech using your voice profile</li>
            <li>Finalizing and preparing the audio for playback</li>
          </ol>
        </div>
      </motion.div>
    </div>
  );
}

export default function ProcessingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProcessingContent />
    </Suspense>
  );
}
