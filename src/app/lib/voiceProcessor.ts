// Voice processing utilities for frontend-only voice cloning

// Interface for voice characteristics
export interface VoiceCharacteristics {
  pitch: number;   // Voice pitch (0.5 to 2.0)
  rate: number;    // Speech rate (0.5 to 2.0)
  volume: number;  // Volume (0 to 1.0)
  timbre: number;  // Voice timbre/quality (0 to 1.0)
}

// Class to analyze voice samples and extract characteristics
export class VoiceAnalyzer {
  private audioContext: AudioContext;
  
  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  
  // Analyze a voice sample to extract characteristics
  async analyzeVoiceSample(audioBlob: Blob): Promise<VoiceCharacteristics> {
    try {
      // Convert blob to array buffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      // Decode the audio data
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // Extract characteristics
      const pitch = this.extractPitch(audioBuffer);
      const rate = this.extractRate(audioBuffer);
      const volume = this.extractVolume(audioBuffer);
      const timbre = this.extractTimbre(audioBuffer);
      
      return { pitch, rate, volume, timbre };
    } catch (error) {
      console.error('Error analyzing voice sample:', error);
      // Return default characteristics if analysis fails
      return { pitch: 1.0, rate: 1.0, volume: 1.0, timbre: 0.5 };
    }
  }
  
  // Extract pitch from audio buffer (simplified)
  private extractPitch(audioBuffer: AudioBuffer): number {
    // In a real implementation, this would use a pitch detection algorithm
    // For this demo, we'll use a simplified approach based on frequency analysis
    
    // Get audio data
    const data = audioBuffer.getChannelData(0);
    
    // Calculate zero-crossings as a simple pitch estimation
    let zeroCrossings = 0;
    for (let i = 1; i < data.length; i++) {
      if ((data[i] >= 0 && data[i - 1] < 0) || (data[i] < 0 && data[i - 1] >= 0)) {
        zeroCrossings++;
      }
    }
    
    // Convert to a normalized pitch value between 0.5 and 2.0
    // More zero crossings generally means higher pitch
    const normalizedPitch = Math.max(0.5, Math.min(2.0, 
      0.5 + (zeroCrossings / data.length) * 100
    ));
    
    return normalizedPitch;
  }
  
  // Extract speech rate from audio buffer (simplified)
  private extractRate(audioBuffer: AudioBuffer): number {
    // In a real implementation, this would analyze speech patterns
    // For this demo, we'll use a simplified approach
    
    // Get audio data
    const data = audioBuffer.getChannelData(0);
    
    // Calculate energy variations as a proxy for speech rate
    let energyVariations = 0;
    const windowSize = 1024;
    
    for (let i = 0; i < data.length - windowSize; i += windowSize) {
      let energy1 = 0;
      let energy2 = 0;
      
      for (let j = 0; j < windowSize / 2; j++) {
        energy1 += Math.abs(data[i + j]);
        energy2 += Math.abs(data[i + windowSize / 2 + j]);
      }
      
      if (Math.abs(energy1 - energy2) > 0.01) {
        energyVariations++;
      }
    }
    
    // Convert to a normalized rate value between 0.5 and 2.0
    const normalizedRate = Math.max(0.5, Math.min(2.0, 
      0.5 + (energyVariations / (data.length / windowSize)) * 5
    ));
    
    return normalizedRate;
  }
  
  // Extract volume from audio buffer
  private extractVolume(audioBuffer: AudioBuffer): number {
    // Get audio data
    const data = audioBuffer.getChannelData(0);
    
    // Calculate RMS (root mean square) as volume
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i];
    }
    
    const rms = Math.sqrt(sum / data.length);
    
    // Normalize to a value between 0 and 1
    return Math.min(1.0, rms * 10);
  }
  
  // Extract timbre from audio buffer (simplified)
  private extractTimbre(audioBuffer: AudioBuffer): number {
    // In a real implementation, this would analyze spectral characteristics
    // For this demo, we'll use a simplified approach
    
    // Get audio data
    const data = audioBuffer.getChannelData(0);
    
    // Use a simple spectral centroid approximation
    let weightedSum = 0;
    let sum = 0;
    
    for (let i = 0; i < data.length; i++) {
      weightedSum += Math.abs(data[i]) * i;
      sum += Math.abs(data[i]);
    }
    
    const spectralCentroid = sum > 0 ? weightedSum / sum : 0;
    
    // Normalize to a value between 0 and 1
    return Math.min(1.0, spectralCentroid / (data.length / 2));
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
      
      // Create a SpeechSynthesisUtterance with the text
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Apply voice characteristics
      utterance.pitch = this.characteristics.pitch;
      utterance.rate = this.characteristics.rate;
      utterance.volume = this.characteristics.volume;
      
      // Get available voices
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        // Try to find a voice that matches the timbre characteristic
        const voiceIndex = Math.floor(this.characteristics.timbre * voices.length);
        utterance.voice = voices[Math.min(voiceIndex, voices.length - 1)];
      }
      
      // Create an audio element to play and capture the speech
      const audioElement = document.createElement('audio');
      
      // Set up the speech synthesis events
      utterance.onend = () => {
        // When speech ends, resolve with the audio URL
        resolve(this.createAudioFromText(text, this.characteristics!));
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        // Fallback to text-based audio generation
        resolve(this.createAudioFromText(text, this.characteristics!));
      };
      
      // Start speaking
      window.speechSynthesis.speak(utterance);
      
      // Set a timeout in case onend doesn't fire
      setTimeout(() => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
          resolve(this.createAudioFromText(text, this.characteristics!));
        }
      }, Math.max(5000, text.length * 100));
    });
  }
  
  // Create audio from text using Web Audio API
  private createAudioFromText(text: string, characteristics: VoiceCharacteristics): Blob {
    // Create an audio buffer for the synthetic speech
    const sampleRate = 44100;
    const duration = Math.max(3, text.length * 0.1); // Estimate duration based on text length
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const channelData = buffer.getChannelData(0);
    
    // Generate audio data based on text and voice characteristics
    const words = text.split(/\s+/);
    const wordDuration = duration / words.length;
    
    for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
      const word = words[wordIndex];
      const wordStart = wordIndex * wordDuration;
      
      for (let charIndex = 0; charIndex < word.length; charIndex++) {
        const charCode = word.charCodeAt(charIndex);
        
        // Use character code to influence the frequency
        const baseFreq = 100 + (charCode % 20) * 10 * characteristics.pitch;
        
        // Calculate time range for this character
        const charDuration = wordDuration / word.length;
        const startSample = Math.floor((wordStart + charIndex * charDuration) * sampleRate);
        const endSample = Math.floor((wordStart + (charIndex + 1) * charDuration) * sampleRate);
        
        // Generate samples for this character
        for (let i = startSample; i < endSample && i < channelData.length; i++) {
          const t = (i - startSample) / sampleRate;
          
          // Add some variation to make it sound more natural
          const vibrato = Math.sin(2 * Math.PI * 5 * t) * 3;
          const freq = baseFreq + vibrato;
          
          // Generate the sample with harmonics
          let sample = Math.sin(2 * Math.PI * freq * t);
          sample += 0.5 * Math.sin(2 * Math.PI * freq * 2 * t);
          sample += 0.25 * Math.sin(2 * Math.PI * freq * 3 * t);
          
          // Apply an envelope to simulate speech patterns
          const envelope = 0.5 + 0.5 * Math.sin(Math.PI * t / charDuration);
          
          // Apply volume
          channelData[i] = sample * envelope * characteristics.volume * 0.3;
        }
      }
      
      // Add a small pause between words
      const pauseDuration = 0.1;
      const pauseStart = Math.floor((wordStart + wordDuration - pauseDuration) * sampleRate);
      const pauseEnd = Math.floor((wordStart + wordDuration) * sampleRate);
      
      for (let i = pauseStart; i < pauseEnd && i < channelData.length; i++) {
        channelData[i] = 0;
      }
    }
    
    // Convert the buffer to a WAV file
    return this.bufferToWav(buffer);
  }
  
  // Convert AudioBuffer to WAV format
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
  
  // Helper function to write strings to DataView
  private writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}

// Main voice cloning class
export class VoiceCloner {
  private analyzer: VoiceAnalyzer;
  private generator: SpeechGenerator;
  private averageCharacteristics: VoiceCharacteristics | null = null;
  
  constructor() {
    this.analyzer = new VoiceAnalyzer();
    this.generator = new SpeechGenerator();
  }
  
  // Process voice samples to extract characteristics
  async processVoiceSamples(samples: Blob[]): Promise<void> {
    if (samples.length === 0) {
      throw new Error('No voice samples provided');
    }
    
    // Analyze each sample
    const characteristicsList = await Promise.all(
      samples.map(sample => this.analyzer.analyzeVoiceSample(sample))
    );
    
    // Calculate average characteristics
    const avgCharacteristics: VoiceCharacteristics = {
      pitch: 0,
      rate: 0,
      volume: 0,
      timbre: 0
    };
    
    characteristicsList.forEach(characteristics => {
      avgCharacteristics.pitch += characteristics.pitch;
      avgCharacteristics.rate += characteristics.rate;
      avgCharacteristics.volume += characteristics.volume;
      avgCharacteristics.timbre += characteristics.timbre;
    });
    
    avgCharacteristics.pitch /= characteristicsList.length;
    avgCharacteristics.rate /= characteristicsList.length;
    avgCharacteristics.volume /= characteristicsList.length;
    avgCharacteristics.timbre /= characteristicsList.length;
    
    // Store the average characteristics
    this.averageCharacteristics = avgCharacteristics;
    
    // Set the characteristics in the generator
    this.generator.setVoiceCharacteristics(avgCharacteristics);
  }
  
  // Generate speech with the cloned voice
  async generateSpeech(text: string): Promise<Blob> {
    if (!this.averageCharacteristics) {
      throw new Error('Voice samples not processed yet');
    }
    
    return this.generator.generateSpeech(text);
  }
  
  // Create a URL for an audio blob
  static createAudioUrl(audioBlob: Blob): string {
    return URL.createObjectURL(audioBlob);
  }
}

// Singleton instance of VoiceCloner
let voiceCloner: VoiceCloner | null = null;

// Get the voice cloner instance
export function getVoiceCloner(): VoiceCloner {
  if (!voiceCloner) {
    voiceCloner = new VoiceCloner();
  }
  return voiceCloner;
}
