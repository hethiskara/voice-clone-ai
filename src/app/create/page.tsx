'use client';

import { useState } from 'react';
import VoiceUploader from '../components/voice/VoiceUploader';
import ScriptInput from '../components/voice/ScriptInput';
import { motion } from 'framer-motion';

enum Step {
  UPLOAD = 'upload',
  SCRIPT = 'script',
  PROCESSING = 'processing'
}

export default function CreatePage() {
  const [currentStep, _setCurrentStep] = useState<Step>(Step.UPLOAD);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex justify-center items-center space-x-4 mb-8">
            {Object.values(Step).map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep === step
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index + 1}
                </div>
                {index < Object.values(Step).length - 1 && (
                  <div className="w-20 h-0.5 mx-2 bg-gray-200" />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {currentStep === Step.UPLOAD && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Upload Voice Samples</h2>
            <p className="text-gray-600 mb-6">
              Upload 3-5 audio clips of your voice to create a unique voice model. It&apos;s best to use clear recordings without background noise.
            </p>
            <VoiceUploader />
          </div>
        )}
        {currentStep === Step.SCRIPT && <ScriptInput />}
        {currentStep === Step.PROCESSING && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-8" />
            <h2 className="text-2xl font-bold mb-4">Processing Your Voice</h2>
            <p className="text-gray-600">
              We're training the AI model with your voice samples. This may take a few minutes...
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
