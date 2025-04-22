'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import VoiceRecorder from './VoiceRecorder';
import { Tab } from '@headlessui/react';
import { useRouter } from 'next/navigation';
import { uploadVoiceSamples } from '@/app/lib/api';

interface VoiceSample {
  file: File;
  preview: string;
  id: string;
}

export default function VoiceUploader() {
  const [samples, setSamples] = useState<VoiceSample[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const maxSamples = 20;
  const router = useRouter();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log('Dropped files:', acceptedFiles);
    const newSamples = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substring(7)
    }));

    setSamples(prev => {
      const updated = [...prev, ...newSamples];
      if (updated.length > maxSamples) {
        toast.error(`Maximum ${maxSamples} samples allowed`);
        return prev;
      }
      return updated;
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.webm']
    },
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const removeSample = (id: string) => {
    setSamples(prev => prev.filter(sample => sample.id !== id));
  };

  const handleRecordingComplete = (blob: Blob) => {
    console.log('Recording complete:', blob);
    const file = new File([blob], `recording-${Date.now()}.wav`, { type: 'audio/wav' });
    const newSample = {
      file,
      preview: URL.createObjectURL(blob),
      id: Math.random().toString(36).substring(7)
    };

    setSamples(prev => {
      if (prev.length >= maxSamples) {
        toast.error(`Maximum ${maxSamples} samples allowed`);
        return prev;
      }
      return [...prev, newSample];
    });
  };

  const handleContinue = async () => {
    if (samples.length < maxSamples) {
      toast.error(`Please upload or record all ${maxSamples} voice samples before continuing. You currently have ${samples.length}.`);
      return;
    }

    try {
      setIsUploading(true);
      console.log('Uploading samples:', samples);
      const response = await uploadVoiceSamples(samples.map(s => s.file));
      console.log('Upload successful, session ID:', response.session_id);
      
      if (response.success && response.session_id) {
        router.push(`/create/script?session=${response.session_id}`);
      } else {
        toast.error('Failed to process voice samples. Please try again.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload voice samples. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold text-purple-800 mb-4">Upload Voice Samples</h2>
        <p className="text-purple-600">
          Upload or record up to {maxSamples} voice samples
        </p>
      </motion.div>

      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-purple-900/10 p-1 mb-6">
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
              ${selected
                ? 'bg-white text-purple-700 shadow'
                : 'text-purple-600 hover:bg-white/[0.12] hover:text-purple-700'
              }`
            }
          >
            Upload Files
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
              ${selected
                ? 'bg-white text-purple-700 shadow'
                : 'text-purple-600 hover:bg-white/[0.12] hover:text-purple-700'
              }`
            }
          >
            Record Voice
          </Tab>
        </Tab.List>
        <Tab.Panels>
          <Tab.Panel>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-purple-500 bg-purple-50' : 'border-purple-200 hover:border-purple-300'}`}
            >
              <input {...getInputProps()} />
              <p className="text-lg font-semibold text-purple-800 mb-2">
                {isDragActive ? 'Drop the files here' : 'Drag & drop voice samples here'}
              </p>
              <p className="text-purple-600">
                or click to select files
              </p>
            </div>
          </Tab.Panel>
          <Tab.Panel>
            <div className="flex justify-center py-8 bg-gray-50 rounded-lg">
              <VoiceRecorder onRecordingComplete={handleRecordingComplete} />
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {samples.map((sample) => (
          <motion.div
            key={sample.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="truncate flex-1 text-purple-700">{sample.file.name}</p>
              <button
                onClick={() => removeSample(sample.id)}
                className="ml-2 text-purple-600 hover:text-purple-800"
              >
                ×
              </button>
            </div>
            <audio controls className="w-full" src={sample.preview} />
          </motion.div>
        ))}
      </div>

      {samples.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 text-center"
        >
          <p className="mb-4 text-lg text-purple-800">
            {samples.length} of {maxSamples} samples uploaded
          </p>
          <button
            onClick={handleContinue}
            disabled={isUploading}
            className={`bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-8 rounded-lg shadow-lg
              ${samples.length < maxSamples || isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 transition-transform'}`}
          >
            {isUploading 
              ? 'Uploading...' 
              : samples.length < maxSamples 
                ? `Upload ${maxSamples - samples.length} More Samples` 
                : 'Continue to Training'}
          </button>
        </motion.div>
      )}
    </div>
  );
}
