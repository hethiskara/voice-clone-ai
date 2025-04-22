export interface ProcessingStatus {
  status: 'training' | 'generating' | 'completed' | 'error';
  progress: number;
  estimatedTimeRemaining?: number;
  message?: string;
  audioUrl?: string;
}
