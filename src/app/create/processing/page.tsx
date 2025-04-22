'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { checkJobStatus } from '@/app/lib/api';
import type { JobStatusResponse } from '@/app/lib/api';

// Create a client component that uses useSearchParams
function ProcessingContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get('job_id');
  const [status, setStatus] = useState<JobStatusResponse | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      setError('No job ID provided');
      return;
    }

    const checkStatus = async () => {
      try {
        const jobStatus = await checkJobStatus(jobId);
        setStatus(jobStatus);
        setProgress(jobStatus.progress);

        if (jobStatus.status === 'completed') {
          window.location.href = `/create/result?job_id=${jobId}`;
        } else if (jobStatus.status === 'error') {
          setError(jobStatus.message || 'An error occurred');
        }
      } catch (error) {
        setError('Failed to check job status');
      }
    };

    // Initial check
    checkStatus();

    // Set up polling
    const intervalId = setInterval(checkStatus, 2000);

    return () => {
      clearInterval(intervalId);
    };
  }, [jobId]);

  const handleRetry = () => {
    window.location.href = '/create';
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-purple-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-700 mb-6">{error}</p>
            <button
              onClick={handleRetry}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-8"
        >
          <h1 className="text-2xl font-bold mb-6 text-center">Processing Your Voice</h1>
          
          <div className="mb-8">
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-600 bg-purple-200">
                    {status?.status || 'Initializing...'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-purple-600">
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-purple-200">
                <div
                  style={{ width: `${progress}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-purple-500 to-pink-500"
                ></div>
              </div>
            </div>
          </div>
          
          <div className="text-center text-gray-600">
            <p className="mb-4">{status?.message || 'Please wait while we process your voice...'}</p>
            <div className="flex justify-center space-x-2 mt-6">
              <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
          
          {progress >= 100 && (
            <div className="mt-8 text-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <h2 className="text-xl font-semibold text-green-600 mb-4">
                  Your Voice Message is Ready!
                </h2>
                <p className="text-gray-600 mb-6">Redirecting you to the results page...</p>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function ProcessingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-white to-purple-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold mb-6 text-center">Loading...</h1>
            <div className="flex justify-center space-x-2 mt-6">
              <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      </div>
    }>
      <ProcessingContent />
    </Suspense>
  );
}
