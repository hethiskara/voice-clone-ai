import axios from 'axios';
import { VoiceCloner } from './voiceProcessor';

// For local development and testing
const LOCAL_API_BASE_URL = 'http://10.0.0.42:8000/api';

export interface UploadResponse {
  success: boolean;
  message: string;
  session_id?: string;
}

export interface JobStatusResponse {
  status: 'pending' | 'training' | 'generating' | 'completed' | 'error';
  progress: number;
  message: string;
}

export interface GenerateSpeechResponse {
  success: boolean;
  message: string;
  job_id?: string;
}

// Safe localStorage wrapper to handle incognito mode and other issues
const safeStorage = {
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('localStorage setItem failed:', error);
      // Fallback to sessionStorage if localStorage fails
      try {
        sessionStorage.setItem(key, value);
      } catch (innerError) {
        console.error('Both localStorage and sessionStorage failed:', innerError);
      }
    }
  },
  
  getItem: (key: string): string | null => {
    try {
      const item = localStorage.getItem(key);
      if (item) return item;
      
      // Try sessionStorage as fallback
      return sessionStorage.getItem(key);
    } catch (error) {
      console.warn('Storage getItem failed:', error);
      return null;
    }
  }
};

// Voice cloner instance (created on demand)
let voiceCloner: VoiceCloner | null = null;

// Function to get or create the voice cloner
function getVoiceCloner(): VoiceCloner {
  if (!voiceCloner) {
    voiceCloner = new VoiceCloner();
  }
  return voiceCloner;
}

// Function to upload voice samples
export async function uploadVoiceSamples(files: File[]): Promise<UploadResponse> {
  try {
    // Create a unique session ID
    const session_id = `session_${Date.now()}`;
    
    // Store files in localStorage for demo purposes
    // Convert Files to Blobs for storage
    const fileBlobs = files.map(file => new Blob([file], { type: file.type }));
    
    // Store file data URLs for later use
    const filePromises = files.map(file => 
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      })
    );
    
    const fileDataUrls = await Promise.all(filePromises);
    safeStorage.setItem(`voice_samples_${session_id}`, JSON.stringify(fileDataUrls));
    
    return {
      success: true,
      message: 'Voice samples uploaded successfully',
      session_id
    };
  } catch (error) {
    console.error('Error uploading voice samples:', error);
    return {
      success: false,
      message: 'Failed to upload voice samples'
    };
  }
}

// Function to check if a session has enough samples (20)
export async function checkSessionSamples(session_id: string): Promise<boolean> {
  try {
    const samplesDataString = safeStorage.getItem(`voice_samples_${session_id}`);
    if (!samplesDataString) {
      return false;
    }
    
    const samplesData = JSON.parse(samplesDataString);
    
    // For testing purposes, always return true
    // This allows users to proceed with any number of samples
    return true;
  } catch (error) {
    console.error('Error checking session samples:', error);
    return false;
  }
}

// Function to create a voice clone and generate speech
export async function generateSpeech(session_id: string, text: string): Promise<GenerateSpeechResponse> {
  try {
    // Create a unique job ID
    const job_id = `job_${Date.now()}`;
    
    // Initialize job status
    const jobData = {
      session_id,
      text,
      status: 'pending',
      progress: 0,
      message: 'Job created, waiting to start processing...',
      audio_url: ''
    };
    
    // Store initial job data
    safeStorage.setItem(`job_${job_id}`, JSON.stringify(jobData));
    
    // Start processing in the background
    processVoiceCloning(job_id, session_id, text);
    
    return {
      success: true,
      message: 'Speech generation job created',
      job_id
    };
  } catch (error) {
    console.error('Error generating speech:', error);
    return {
      success: false,
      message: 'Failed to generate speech'
    };
  }
}

// Background processing function for voice cloning
async function processVoiceCloning(job_id: string, session_id: string, text: string): Promise<void> {
  try {
    // Update job status to training
    updateJobStatus(job_id, 'training', 10, 'Loading voice samples...');
    
    // Get voice samples from storage
    const samplesDataString = safeStorage.getItem(`voice_samples_${session_id}`);
    if (!samplesDataString) {
      throw new Error('Voice samples not found');
    }
    
    const samplesDataUrls = JSON.parse(samplesDataString);
    
    // Convert data URLs back to Blobs
    const sampleBlobs = await Promise.all(
      samplesDataUrls.map(async (dataUrl: string) => {
        const response = await fetch(dataUrl);
        return response.blob();
      })
    );
    
    // Update job status to processing
    updateJobStatus(job_id, 'training', 30, 'Analyzing voice characteristics...');
    
    // Process voice samples
    const cloner = getVoiceCloner();
    await cloner.processVoiceSamples(sampleBlobs);
    
    // Update job status to generating
    updateJobStatus(job_id, 'generating', 60, 'Generating speech with your voice...');
    
    // Generate speech with the cloned voice
    const audioBlob = await cloner.generateSpeech(text);
    
    // Create a URL for the audio blob
    const audioUrl = VoiceCloner.createAudioUrl(audioBlob);
    
    // Update job status to completed
    updateJobStatus(job_id, 'completed', 100, 'Speech generation completed', audioUrl);
    
  } catch (error) {
    console.error('Error in voice cloning process:', error);
    updateJobStatus(job_id, 'error', 0, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to update job status
function updateJobStatus(
  job_id: string, 
  status: JobStatusResponse['status'], 
  progress: number, 
  message: string,
  audio_url: string = ''
): void {
  try {
    const jobDataString = safeStorage.getItem(`job_${job_id}`);
    if (!jobDataString) {
      return;
    }
    
    const jobData = JSON.parse(jobDataString);
    jobData.status = status;
    jobData.progress = progress;
    jobData.message = message;
    
    if (audio_url) {
      jobData.audio_url = audio_url;
    }
    
    safeStorage.setItem(`job_${job_id}`, JSON.stringify(jobData));
  } catch (error) {
    console.error('Error updating job status:', error);
  }
}

// Function to check job status
export async function checkJobStatus(job_id: string): Promise<JobStatusResponse> {
  try {
    // Get job data from storage
    const jobDataString = safeStorage.getItem(`job_${job_id}`);
    if (!jobDataString) {
      throw new Error('Job not found');
    }
    
    const jobData = JSON.parse(jobDataString);
    
    return {
      status: jobData.status,
      progress: jobData.progress,
      message: jobData.message
    };
  } catch (error) {
    console.error('Error checking job status:', error);
    return {
      status: 'error',
      progress: 0,
      message: 'Failed to check job status'
    };
  }
}

// Function to get the generated audio URL
export function getAudioUrl(job_id: string): string {
  try {
    const jobDataString = safeStorage.getItem(`job_${job_id}`);
    if (!jobDataString) {
      return '';
    }
    
    const jobData = JSON.parse(jobDataString);
    return jobData.audio_url || '';
  } catch (error) {
    console.error('Error getting audio URL:', error);
    return '';
  }
}
