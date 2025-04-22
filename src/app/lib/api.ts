import axios from 'axios';

// Replace with your ElevenLabs API key
const ELEVENLABS_API_KEY = 'YOUR_ELEVENLABS_API_KEY';
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

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

// Function to upload voice samples to ElevenLabs
export async function uploadVoiceSamples(files: File[]): Promise<UploadResponse> {
  try {
    // Create a unique session ID
    const session_id = `session_${Date.now()}`;
    
    // Store files in localStorage for demo purposes
    // In a real app, you might want to use IndexedDB for larger files
    const filePromises = files.map(file => 
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      })
    );
    
    const fileDataUrls = await Promise.all(filePromises);
    
    // Use our safe storage wrapper
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

// Function to create a voice clone with ElevenLabs
export async function generateSpeech(session_id: string, text: string): Promise<GenerateSpeechResponse> {
  try {
    // For demo purposes, we'll just create a job ID
    // In a real implementation, you would call ElevenLabs API to create a voice
    const job_id = `job_${Date.now()}`;
    
    // Store the job information
    const jobData = {
      session_id,
      text,
      status: 'pending',
      progress: 0,
      message: 'Job created, waiting to start processing...'
    };
    
    // Use our safe storage wrapper
    safeStorage.setItem(`job_${job_id}`, JSON.stringify(jobData));
    
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

// Function to check job status
export async function checkJobStatus(job_id: string): Promise<JobStatusResponse> {
  try {
    // Get job data from storage
    const jobDataString = safeStorage.getItem(`job_${job_id}`);
    if (!jobDataString) {
      throw new Error('Job not found');
    }
    
    const jobData = JSON.parse(jobDataString);
    
    // Update job status (simulate processing)
    if (jobData.status === 'pending') {
      jobData.status = 'training';
      jobData.progress = 30;
      jobData.message = 'Training voice model...';
      safeStorage.setItem(`job_${job_id}`, JSON.stringify(jobData));
    } else if (jobData.status === 'training') {
      jobData.status = 'generating';
      jobData.progress = 70;
      jobData.message = 'Generating speech...';
      safeStorage.setItem(`job_${job_id}`, JSON.stringify(jobData));
    } else if (jobData.status === 'generating') {
      jobData.status = 'completed';
      jobData.progress = 100;
      jobData.message = 'Speech generation completed';
      jobData.audio_url = 'https://www2.cs.uic.edu/~i101/SoundFiles/CantinaBand3.wav';
      safeStorage.setItem(`job_${job_id}`, JSON.stringify(jobData));
    }
    
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
      // Return a default sample URL if job not found
      return 'https://www2.cs.uic.edu/~i101/SoundFiles/CantinaBand3.wav';
    }
    
    const jobData = JSON.parse(jobDataString);
    return jobData.audio_url || 'https://www2.cs.uic.edu/~i101/SoundFiles/CantinaBand3.wav';
  } catch (error) {
    console.error('Error getting audio URL:', error);
    // Return a default sample URL if there's an error
    return 'https://www2.cs.uic.edu/~i101/SoundFiles/CantinaBand3.wav';
  }
}

// ElevenLabs API integration (commented out until you get an API key)
/*
// Create a voice clone with ElevenLabs
export async function createVoiceClone(name: string, files: File[]): Promise<any> {
  const formData = new FormData();
  formData.append('name', name);
  
  files.forEach((file, index) => {
    formData.append(`files`, file);
  });
  
  const response = await axios.post(
    `${ELEVENLABS_API_URL}/voices/add`,
    formData,
    {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'multipart/form-data'
      }
    }
  );
  
  return response.data;
}

// Generate speech with the cloned voice
export async function generateSpeechWithElevenLabs(voiceId: string, text: string): Promise<any> {
  const response = await axios.post(
    `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
    {
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    },
    {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      responseType: 'blob'
    }
  );
  
  return response.data;
}
*/
