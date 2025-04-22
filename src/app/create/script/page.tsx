'use client';

import { useState, Suspense, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { generateSpeech, checkSessionSamples } from '@/app/lib/api';

function ScriptContent() {
  const [script, setScript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  const maxLength = 1000;

  useEffect(() => {
    // Check if the session has enough samples
    const validateSession = async () => {
      if (!sessionId) {
        toast.error('No session ID found. Please upload voice samples first.');
        router.push('/create');
        return;
      }

      try {
        setIsLoading(true);
        const hasEnoughSamples = await checkSessionSamples(sessionId);
        
        if (!hasEnoughSamples) {
          toast.error('You need to upload 20 voice samples before continuing.');
          router.push('/create');
        }
      } catch (error) {
        console.error('Session validation error:', error);
        toast.error('Error validating your session. Please try again.');
        router.push('/create');
      } finally {
        setIsLoading(false);
      }
    };

    validateSession();
  }, [sessionId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sessionId) {
      toast.error('No session ID found. Please upload voice samples first.');
      return;
    }
    
    if (!script.trim()) {
      toast.error('Please enter some text to generate speech.');
      return;
    }
    
    try {
      setIsGenerating(true);
      
      // Generate speech with the provided text and session ID
      const response = await generateSpeech(script, sessionId);
      
      // Redirect to the processing page with the job ID
      router.push(`/create/processing?job_id=${response}`);
    } catch (error) {
      console.error('Error generating speech:', error);
      toast.error('Failed to generate speech. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-purple-800 mb-4">Validating your session...</h2>
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
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-8"
        >
          <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Enter Your Script
          </h1>
          
          <p className="text-gray-600 mb-6">
            Write or paste the text you want to convert to speech using your trained voice model.
          </p>

          <div className="relative mb-6">
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value.slice(0, maxLength))}
              className="w-full h-48 p-4 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              placeholder="Enter your text here..."
              disabled={isGenerating}
            />
            <div className="absolute bottom-4 right-4 text-sm text-gray-500">
              {script.length}/{maxLength}
            </div>
          </div>

          <div className="flex justify-end">
            <motion.button
              onClick={handleSubmit}
              disabled={isGenerating}
              whileHover={{ scale: isGenerating ? 1 : 1.05 }}
              whileTap={{ scale: isGenerating ? 1 : 0.95 }}
              className={`bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-8 rounded-lg shadow-lg
                ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isGenerating ? 'Starting Generation...' : 'Generate Voice'}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function ScriptPage() {
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
      <ScriptContent />
    </Suspense>
  );
}
