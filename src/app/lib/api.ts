import axios, { AxiosError } from 'axios';

// For production with Render.com backend
const API_BASE_URL = 'https://voice-clone-ai-backend.onrender.com/api';

// For local development (uncomment for local testing)
// const API_BASE_URL = 'http://localhost:8000/api';

export interface JobStatus {
  status: 'queued' | 'training' | 'generating' | 'completed' | 'error';
  progress: number;
  message?: string;
}

export interface UploadResponse {
  session_id: string;
  message: string;
  saved_files?: string[];
  error?: string;
}

export async function uploadVoiceSamples(files: File[]): Promise<string> {
  const formData = new FormData();
  
  // Add each file to FormData with a unique key
  files.forEach((file) => {
    formData.append('files', file);
  });

  try {
    console.log('Uploading files:', files.map(f => ({ name: f.name, size: f.size })));
    
    const response = await axios.post<UploadResponse>(`${API_BASE_URL}/upload-samples`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 30000, // 30 seconds timeout
      validateStatus: (status) => status >= 200 && status < 500 // Handle 4xx errors in catch block
    });

    console.log('Upload response:', response.data);

    if (response.data.error) {
      throw new Error(response.data.error);
    }

    if (!response.data.session_id) {
      throw new Error('No session ID returned from server');
    }

    return response.data.session_id;
  } catch (error) {
    console.error('Upload error:', error);
    
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<UploadResponse>;
      if (axiosError.response?.data?.error) {
        throw new Error(axiosError.response.data.error);
      } else if (axiosError.code === 'ECONNABORTED') {
        throw new Error('Upload timed out. Please try again.');
      } else if (axiosError.message) {
        throw new Error(`Upload failed: ${axiosError.message}`);
      }
    }
    
    throw new Error('Upload failed. Please try again.');
  }
}

export async function generateSpeech(sessionId: string, text: string): Promise<string> {
  try {
    const response = await axios.post(`${API_BASE_URL}/generate-speech/${sessionId}`, { text });
    return response.data.job_id;
  } catch (error) {
    console.error('Speech generation error:', error);
    throw error;
  }
}

export async function getJobStatus(jobId: string): Promise<JobStatus> {
  try {
    const response = await axios.get(`${API_BASE_URL}/status/${jobId}`);
    return response.data;
  } catch (error) {
    console.error('Job status error:', error);
    throw error;
  }
}

export async function downloadAudio(jobId: string): Promise<Blob> {
  try {
    const response = await axios.get(`${API_BASE_URL}/audio/${jobId}`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Audio download error:', error);
    throw error;
  }
}

export function getAudioUrl(jobId: string): string {
  return `${API_BASE_URL}/audio/${jobId}`;
}
