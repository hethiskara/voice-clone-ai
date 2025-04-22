'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { generateSpeech } from '@/app/lib/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function ScriptInput() {
  const [script, setScript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const maxLength = 1000;
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');

  const handleSubmit = async () => {
    if (!sessionId) {
      toast.error('No voice samples found. Please upload voice samples first.');
      router.push('/create');
      return;
    }

    if (!script.trim()) {
      toast.error('Please enter some text to convert to speech');
      return;
    }

    try {
      setIsGenerating(true);
      
      // Generate speech with the provided text and session ID
      const job_id = await generateSpeech(script.trim(), sessionId);
      
      // Redirect to the processing page with the job ID
      router.push(`/create/processing?job_id=${job_id}`);
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to start voice generation. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold text-purple-800 mb-4">Enter Your Script</h2>
        <p className="text-purple-600 mb-6">
          Write or paste the text you want to convert to speech (max {maxLength} characters)
        </p>
      </motion.div>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value.slice(0, maxLength))}
          placeholder="Enter your text here..."
          rows={6}
          className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <div className="text-right text-sm text-gray-500 mt-2">
          {script.length}/{maxLength} characters
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleSubmit}
          disabled={!script.trim() || isGenerating}
          className={`bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-8 rounded-lg shadow-lg
            ${!script.trim() || isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 transition-transform'}`}
        >
          {isGenerating ? 'Generating...' : 'Generate Voice'}
        </button>
      </div>
    </div>
  );
}
