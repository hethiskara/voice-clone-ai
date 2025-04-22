/**
 * Frontend Voice Processing Library
 * 
 * This library simulates voice cloning in the browser using Web Audio API.
 * It's a simplified demonstration and doesn't perform actual ML-based voice cloning.
 */

// Voice characteristics that we'll extract and apply
interface VoiceCharacteristics {
  pitch: number;      // Base pitch of the voice
  rate: number;       // Speaking rate
  volume: number;     // Voice volume
  timbre: number;     // Voice timbre (simplified as a single value)
}

// Class to handle voice sample analysis
export class VoiceAnalyzer {
  private audioContext: AudioContext;
  private analyzer: AnalyserNode;
  
  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyzer = this.audioContext.createAnalyser();
    this.analyzer.fftSize = 2048;
  }
  
  // Analyze voice samples to extract basic characteristics
  async analyzeVoiceSamples(audioBlobs: Blob[]): Promise<VoiceCharacteristics> {
    // In a real implementation, we would perform actual audio analysis
    // For this demo, we'll extract some basic characteristics from the first sample
    
    if (audioBlobs.length === 0) {
      throw new Error('No voice samples provided');
    }
    
    try {
      // Process the first audio blob
      const arrayBuffer = await audioBlobs[0].arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // Extract basic characteristics
      const characteristics = this.extractCharacteristics(audioBuffer);
      
      // If we have multiple samples, refine the characteristics
      if (audioBlobs.length > 1) {
        // In a real implementation, we would analyze all samples and average/refine
        // For demo purposes, we'll just slightly adjust based on number of samples
        characteristics.timbre += (audioBlobs.length - 1) * 0.05;
      }
      
      return characteristics;
    } catch (error) {
      console.error('Error analyzing voice samples:', error);
      // Return default characteristics if analysis fails
      return {
        pitch: 1.0,
        rate: 1.0,
        volume: 1.0,
        timbre: 0.5
      };
    }
  }
  
  private extractCharacteristics(audioBuffer: AudioBuffer): VoiceCharacteristics {
    // In a real implementation, we would perform actual audio analysis
    // For this demo, we'll use simplified calculations
    
    const data = audioBuffer.getChannelData(0);
    let sum = 0;
    let max = 0;
    
    // Calculate simple metrics
    for (let i = 0; i < data.length; i++) {
      sum += Math.abs(data[i]);
      max = Math.max(max, Math.abs(data[i]));
    }
    
    const average = sum / data.length;
    
    // Create simplified characteristics
    // These are not scientifically accurate but provide a demo effect
    return {
      pitch: 0.8 + (max * 0.4),           // Range ~0.8-1.2
      rate: 0.9 + (average * 2),          // Range ~0.9-1.1
      volume: 0.7 + (max * 0.6),          // Range ~0.7-1.3
      timbre: 0.3 + (average * 1.4)       // Range ~0.3-0.7
    };
  }
}

// Class to generate speech with the extracted characteristics
export class SpeechGenerator {
  private audioContext: AudioContext;
  private characteristics: VoiceCharacteristics | null = null;
  
  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  
  // Set the voice characteristics to use for speech generation
  setVoiceCharacteristics(characteristics: VoiceCharacteristics) {
    this.characteristics = characteristics;
  }
  
  // Generate speech using Web Speech API with applied characteristics
  async generateSpeech(text: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.characteristics) {
        reject(new Error('Voice characteristics not set'));
        return;
      }
      
      try {
        // Create a SpeechSynthesisUtterance with the text
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Apply voice characteristics
        utterance.pitch = this.characteristics.pitch;
        utterance.rate = this.characteristics.rate;
        utterance.volume = this.characteristics.volume;
        
        // Select a voice (this is simplified - in reality, voice selection would be more complex)
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          // Try to find a voice that matches the timbre characteristic
          const voiceIndex = Math.floor(this.characteristics.timbre * voices.length);
          utterance.voice = voices[Math.min(voiceIndex, voices.length - 1)];
        }
        
        // Create an audio context and destination stream for recording
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const destination = audioContext.createMediaStreamDestination();
        
        // Create an oscillator to simulate the voice
        const oscillator = audioContext.createOscillator();
        oscillator.type = 'sine';
        
        // Create a gain node to control volume
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0.1;
        
        // Connect the oscillator to the gain node and the gain node to the destination
        oscillator.connect(gainNode);
        gainNode.connect(destination);
        
        // Create a MediaRecorder to record the audio
        let audioChunks: Blob[] = [];
        let mediaRecorder: MediaRecorder;
        
        // Function to create a synthetic audio file if MediaRecorder fails
        const createSyntheticAudio = () => {
          // Create a buffer for the synthetic audio
          const sampleRate = 44100;
          const duration = Math.max(3, text.length * 0.1);
          const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
          const channelData = buffer.getChannelData(0);
          
          // Generate audio data based on text and voice characteristics
          for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            
            // Base frequency modulated by the pitch characteristic
            const baseFreq = 120 * this.characteristics!.pitch;
            
            // Add some variation to make it sound more natural
            const vibrato = Math.sin(2 * Math.PI * 5 * t) * 3;
            const freq = baseFreq + vibrato;
            
            // Generate the sample
            let sample = Math.sin(2 * Math.PI * freq * t);
            
            // Add some harmonics
            sample += 0.5 * Math.sin(2 * Math.PI * freq * 2 * t);
            sample += 0.25 * Math.sin(2 * Math.PI * freq * 3 * t);
            
            // Apply an envelope to simulate speech patterns
            const envelopeFreq = 2 * this.characteristics!.rate;
            const envelope = 0.5 + 0.5 * Math.sin(2 * Math.PI * envelopeFreq * t);
            
            // Apply volume
            channelData[i] = sample * envelope * this.characteristics!.volume * 0.3;
          }
          
          // Convert the buffer to a WAV file
          const wavBlob = this.bufferToWav(buffer);
          resolve(wavBlob);
        };
        
        try {
          mediaRecorder = new MediaRecorder(destination.stream);
          
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              audioChunks.push(event.data);
            }
          };
          
          mediaRecorder.onstop = () => {
            if (audioChunks.length > 0) {
              const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
              resolve(audioBlob);
            } else {
              // If no chunks were recorded, create a synthetic audio file
              createSyntheticAudio();
            }
          };
          
          // Start recording
          mediaRecorder.start();
          
          // Start the oscillator
          oscillator.start();
          
          // Speak the text
          window.speechSynthesis.speak(utterance);
          
          // Calculate an estimated duration based on text length and speech rate
          const estimatedDuration = Math.max(3000, (text.length / this.characteristics.rate) * 100);
          
          // Stop recording after the estimated duration
          setTimeout(() => {
            oscillator.stop();
            mediaRecorder.stop();
            window.speechSynthesis.cancel(); // Stop any ongoing speech
          }, estimatedDuration);
        } catch (error) {
          console.error('MediaRecorder error:', error);
          createSyntheticAudio();
        }
      } catch (error) {
        console.error('Error generating speech:', error);
        
        // Create a fallback audio file with a simple melody
        const sampleRate = 44100;
        const duration = 3;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate a simple melody
        const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88]; // C4 to B4
        for (let i = 0; i < sampleRate * duration; i++) {
          const timeInSec = i / sampleRate;
          const noteIndex = Math.floor(timeInSec * 2) % notes.length;
          data[i] = 0.5 * Math.sin(2 * Math.PI * notes[noteIndex] * timeInSec);
        }
        
        const wavBlob = this.bufferToWav(buffer);
        resolve(wavBlob);
      }
    });
  }
  
  // Helper function to convert AudioBuffer to WAV format
  private bufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const numSamples = buffer.length;
    const bytesPerSample = 2; // 16-bit
    
    // Create the WAV file header
    const headerBytes = 44;
    const dataBytes = numChannels * numSamples * bytesPerSample;
    const arrayBuffer = new ArrayBuffer(headerBytes + dataBytes);
    const view = new DataView(arrayBuffer);
    
    // RIFF chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataBytes, true);
    this.writeString(view, 8, 'WAVE');
    
    // fmt sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // audio format (PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bytesPerSample, true); // byte rate
    view.setUint16(32, numChannels * bytesPerSample, true); // block align
    view.setUint16(34, 8 * bytesPerSample, true); // bits per sample
    
    // data sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataBytes, true);
    
    // Write the audio data
    const offset = 44;
    const channelData = [];
    for (let i = 0; i < numChannels; i++) {
      channelData.push(buffer.getChannelData(i));
    }
    
    for (let i = 0; i < numSamples; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
        const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset + (i * numChannels + channel) * bytesPerSample, value, true);
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }
  
  private writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}

// Main class that combines analysis and generation
export class VoiceCloner {
  private analyzer: VoiceAnalyzer;
  private generator: SpeechGenerator;
  private characteristics: VoiceCharacteristics | null = null;
  
  constructor() {
    this.analyzer = new VoiceAnalyzer();
    this.generator = new SpeechGenerator();
  }
  
  // Process voice samples to extract characteristics
  async processVoiceSamples(audioBlobs: Blob[]): Promise<void> {
    this.characteristics = await this.analyzer.analyzeVoiceSamples(audioBlobs);
    this.generator.setVoiceCharacteristics(this.characteristics);
  }
  
  // Generate speech with the cloned voice
  async generateSpeech(text: string): Promise<Blob> {
    if (!this.characteristics) {
      throw new Error('Voice samples have not been processed yet');
    }
    
    return this.generator.generateSpeech(text);
  }
  
  // Get the URL for an audio blob
  static createAudioUrl(audioBlob: Blob): string {
    return URL.createObjectURL(audioBlob);
  }
  
  // Clean up resources
  static revokeAudioUrl(url: string): void {
    URL.revokeObjectURL(url);
  }
}
