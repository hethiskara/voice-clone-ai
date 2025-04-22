'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
}

export default function VoiceRecorder({ onRecordingComplete }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          sampleSize: 16
        }
      });
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      const chunks: Blob[] = [];

      const handleDataAvailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.ondataavailable = handleDataAvailable;
      recorder.onstop = async () => {
        // First create a webm blob
        const webmBlob = new Blob(chunks, { type: 'audio/webm;codecs=opus' });
        
        try {
          // Convert webm to wav using the Web Audio API
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const arrayBuffer = await webmBlob.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          // Create WAV file
          const wavBuffer = audioBufferToWav(audioBuffer);
          const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
          
          onRecordingComplete(wavBlob);
        } catch (error) {
          console.error('Error converting audio:', error);
          toast.error('Error processing audio. Please try again.');
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error) {
      console.error('Recording error:', error);
      toast.error('Please allow microphone access to record');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Function to convert AudioBuffer to WAV format
  function audioBufferToWav(buffer: AudioBuffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    
    // Create the buffer for the WAV file
    const dataLength = buffer.length * numChannels * bytesPerSample;
    const bufferLength = 44 + dataLength;
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    writeString(view, 0, 'RIFF'); // RIFF identifier
    view.setUint32(4, 36 + dataLength, true); // file length minus RIFF identifier length and file description length
    writeString(view, 8, 'WAVE'); // WAVE identifier
    writeString(view, 12, 'fmt '); // format chunk identifier
    view.setUint32(16, 16, true); // format chunk length
    view.setUint16(20, format, true); // sample format (raw)
    view.setUint16(22, numChannels, true); // channel count
    view.setUint32(24, sampleRate, true); // sample rate
    view.setUint32(28, sampleRate * blockAlign, true); // byte rate (sample rate * block align)
    view.setUint16(32, blockAlign, true); // block align (channel count * bytes per sample)
    view.setUint16(34, bitDepth, true); // bits per sample
    writeString(view, 36, 'data'); // data chunk identifier
    view.setUint32(40, dataLength, true); // data chunk length
    
    // Write the PCM samples
    const offset = 44;
    const channelData = new Float32Array(buffer.length);
    let index = 0;
    
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      buffer.copyFromChannel(channelData, i, 0);
      
      for (let j = 0; j < channelData.length; j++) {
        const sample = Math.max(-1, Math.min(1, channelData[j]));
        const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset + index, value, true);
        index += bytesPerSample;
      }
    }
    
    return arrayBuffer;
  }

  // Helper function to write strings to the DataView
  function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <motion.button
        onClick={isRecording ? stopRecording : startRecording}
        className={`w-16 h-16 rounded-full flex items-center justify-center ${
          isRecording 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-purple-600 hover:bg-purple-700'
        } text-white shadow-lg transition-colors`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isRecording ? (
          <StopIcon className="w-8 h-8" />
        ) : (
          <MicrophoneIcon className="w-8 h-8" />
        )}
      </motion.button>
      
      {isRecording && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="text-xl font-semibold text-red-500">Recording</div>
          <div className="text-gray-600">{formatTime(recordingTime)}</div>
        </motion.div>
      )}
    </div>
  );
}
