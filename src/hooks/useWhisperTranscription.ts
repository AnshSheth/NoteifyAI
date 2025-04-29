import { useState, useRef, useCallback, useEffect } from 'react';

interface Segment {
  id: number;
  start: number;
  end: number;
  text: string;
}

interface UseWhisperTranscriptionResult {
  transcript: {
    text: string;
    segments: Segment[];
  };
  isRecording: boolean;
  isProcessing: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  error: string | null;
  resetTranscript: () => void;
}

// Configuration
const PROCESSING_INTERVAL_MS = 5000; // Process audio every 5 seconds

// WAV encoder utilities
class WavEncoder {
  private sampleRate: number;
  private numChannels: number;

  constructor(sampleRate = 16000, numChannels = 1) {
    this.sampleRate = sampleRate;
    this.numChannels = numChannels;
  }

  encodeWAV(samples: Float32Array): Blob {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    // RIFF identifier
    this.writeString(view, 0, 'RIFF');
    // RIFF chunk length
    view.setUint32(4, 36 + samples.length * 2, true);
    // RIFF type
    this.writeString(view, 8, 'WAVE');
    // format chunk identifier
    this.writeString(view, 12, 'fmt ');
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (1 is PCM)
    view.setUint16(20, 1, true);
    // channel count
    view.setUint16(22, this.numChannels, true);
    // sample rate
    view.setUint32(24, this.sampleRate, true);
    // byte rate (sample rate * block align)
    view.setUint32(28, this.sampleRate * 2 * this.numChannels, true);
    // block align (channel count * bytes per sample)
    view.setUint16(32, this.numChannels * 2, true);
    // bits per sample
    view.setUint16(34, 16, true);
    // data chunk identifier
    this.writeString(view, 36, 'data');
    // data chunk length
    view.setUint32(40, samples.length * 2, true);

    // write the PCM samples
    const index = 44;
    for (let i = 0; i < samples.length; i++) {
      // convert Float32 to Int16
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(index + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    return new Blob([view], { type: 'audio/wav' });
  }

  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}

export function useWhisperTranscription(): UseWhisperTranscriptionResult {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<{ text: string; segments: Segment[] }>({
    text: '',
    segments: [],
  });

  // Audio Context and recorder setup
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioBufferRef = useRef<Float32Array[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const lastProcessedTimeRef = useRef<number>(0);
  const processingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wavEncoderRef = useRef<WavEncoder | null>(null);

  // Clean up function to reset recording state
  const cleanup = useCallback(() => {
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
      processingIntervalRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioContextRef.current?.state !== 'closed') {
      audioContextRef.current?.close();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    audioContextRef.current = null;
    audioBufferRef.current = [];
  }, []);

  // Clean up on component unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Function to process audio chunks
  const processAudio = useCallback(async () => {
    try {
      if (audioBufferRef.current.length === 0) return;
      
      setIsProcessing(true);
      
      // Calculate the timestamp for this chunk
      const currentTime = Date.now();
      const chunkStartTime = lastProcessedTimeRef.current || recordingStartTimeRef.current;
      lastProcessedTimeRef.current = currentTime;

      // Merge all the audio data
      const bufferSize = audioBufferRef.current.reduce((sum, buffer) => sum + buffer.length, 0);
      const mergedBuffer = new Float32Array(bufferSize);
      
      let offset = 0;
      for (const buffer of audioBufferRef.current) {
        mergedBuffer.set(buffer, offset);
        offset += buffer.length;
      }
      
      // Clear the buffer after merging
      audioBufferRef.current = [];
      
      // Skip processing very small audio chunks
      if (bufferSize < 1000) {
        console.log('Audio chunk too small, skipping processing');
        setIsProcessing(false);
        return;
      }
      
      // Check for audio levels to make sure we're capturing sound
      let maxLevel = 0;
      let sumSquares = 0;
      for (let i = 0; i < mergedBuffer.length; i++) {
        const value = Math.abs(mergedBuffer[i]);
        if (value > maxLevel) maxLevel = value;
        sumSquares += value * value;
      }
      const rms = Math.sqrt(sumSquares / mergedBuffer.length);
      console.log(`Audio levels - Max: ${maxLevel.toFixed(3)}, RMS: ${rms.toFixed(3)}`);
      
      // Skip if audio level is too low (likely silence)
      if (maxLevel < 0.01 && rms < 0.005) {
        console.log('Audio level too low, likely silence - skipping processing');
        setIsProcessing(false);
        return;
      }
      
      // Normalize audio to improve signal (if levels are too low)
      if (maxLevel < 0.1) {
        console.log(`Audio level low, applying normalization. Before max: ${maxLevel.toFixed(3)}`);
        const gain = 0.8 / maxLevel; // Target 80% of full scale
        for (let i = 0; i < mergedBuffer.length; i++) {
          mergedBuffer[i] = mergedBuffer[i] * gain;
        }
        const newMax = Math.max(...Array.from(mergedBuffer).map(Math.abs));
        console.log(`After normalization, max level: ${newMax.toFixed(3)}`);
      }
      
      console.log(`Processing audio chunk starting at ${chunkStartTime - recordingStartTimeRef.current}ms, samples: ${bufferSize}`);
      
      // Create WAV blob from the audio data
      const wavBlob = wavEncoderRef.current?.encodeWAV(mergedBuffer) || 
        new Blob([], { type: 'audio/wav' });
      
      console.log(`WAV blob created, size: ${wavBlob.size} bytes`);
      
      // Create FormData and append the audio file
      const formData = new FormData();
      formData.append('file', wavBlob, 'audio-chunk.wav');
      formData.append('timestamp', String(chunkStartTime - recordingStartTimeRef.current));
      
      // Log request details
      console.log(`Sending audio chunk to API: size=${wavBlob.size}, timestamp=${chunkStartTime - recordingStartTimeRef.current}ms`);
      
      // Send to our API endpoint
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        const errorMessage = `API Error (${response.status}): ${JSON.stringify(errorData)}`;
        setError(errorMessage);
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('Received transcription result:', result);
      
      // Check if we have segments to add
      if (result.segments && result.segments.length > 0) {
        // Update transcript with new segments
        setTranscript(prevTranscript => {
          // Combine existing segments with new ones, avoiding duplicates
          const existingIds = new Set(prevTranscript.segments.map(s => s.id));
          const newSegments = [
            ...prevTranscript.segments,
            ...result.segments.filter((segment: Segment) => !existingIds.has(segment.id))
          ].sort((a, b) => a.start - b.start);
          
          // Generate the full text from all segments
          const fullText = newSegments.map(s => s.text).join(' ');
          
          return {
            text: fullText,
            segments: newSegments,
          };
        });
      } else {
        console.log('No segments returned from API');
      }
      
    } catch (error) {
      console.error('Error processing audio chunk:', error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Start recording function
  const startRecording = useCallback(async () => {
    try {
      setIsRecording(true);
      setError(null);
      
      // Reset transcript
      setTranscript({
        text: '',
        segments: [],
      });
      
      // Get media stream with audio settings optimized for speech
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 16000, // Whisper prefers 16kHz
        }
      });
      streamRef.current = stream;
      
      // Create audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000 // Use 16kHz sample rate for Whisper
      });
      audioContextRef.current = audioContext;
      
      // Create source from the stream
      const source = audioContext.createMediaStreamSource(stream);
      
      // Add a gain node to boost the signal
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 1.5; // Boost gain to ensure we capture voice
      source.connect(gainNode);
      
      // Create an analyzer to monitor audio levels
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      gainNode.connect(analyser);
      
      // Set up periodic level monitoring
      const dataArray = new Float32Array(analyser.frequencyBinCount);
      const checkLevels = () => {
        if (audioContextRef.current && isRecording) {
          analyser.getFloatTimeDomainData(dataArray);
          let maxLevel = 0;
          for (let i = 0; i < dataArray.length; i++) {
            maxLevel = Math.max(maxLevel, Math.abs(dataArray[i]));
          }
          console.log(`Current audio level: ${maxLevel.toFixed(3)}`);
          
          // Schedule next check
          setTimeout(checkLevels, 1000);
        }
      };
      setTimeout(checkLevels, 1000);
      
      // Initialize WAV encoder
      wavEncoderRef.current = new WavEncoder(audioContext.sampleRate);
      
      // Create processor node (ScriptProcessorNode is deprecated but still works reliably)
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      
      // Clear audio buffer
      audioBufferRef.current = [];
      
      // Set up audio processing
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Check if there's any sound in this buffer
        let hasSound = false;
        let maxLevel = 0;
        for (let i = 0; i < inputData.length; i++) {
          const abs = Math.abs(inputData[i]);
          if (abs > 0.01) hasSound = true;
          maxLevel = Math.max(maxLevel, abs);
        }
        
        if (hasSound) {
          console.log(`Captured audio buffer with max level: ${maxLevel.toFixed(3)}`);
        }
        
        // Copy the data to avoid issues with reused buffers
        const audioData = new Float32Array(inputData.length);
        audioData.set(inputData);
        audioBufferRef.current.push(audioData);
      };
      
      // Connect the nodes - connect gain node to processor
      gainNode.connect(processor);
      processor.connect(audioContext.destination);
      
      // Store initial recording time
      recordingStartTimeRef.current = Date.now();
      lastProcessedTimeRef.current = recordingStartTimeRef.current;
      
      console.log('Recording started at', new Date(recordingStartTimeRef.current).toISOString());
      console.log(`Using audio context with sample rate: ${audioContext.sampleRate}Hz`);
      
      // Set up interval to process audio chunks during recording
      processingIntervalRef.current = setInterval(() => {
        processAudio();
      }, PROCESSING_INTERVAL_MS);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setError(error instanceof Error ? error.message : String(error));
      setIsRecording(false);
      cleanup();
    }
  }, [cleanup, processAudio]);

  // Stop recording function
  const stopRecording = useCallback(async () => {
    if (!isRecording) return;
    
    setIsRecording(false);
    console.log('Stopping recording...');
    
    try {
      // Final processing of any remaining audio
      await processAudio();
      
      // Cleanup resources
      cleanup();
    } catch (error) {
      console.error('Error in stop recording:', error);
      setError(`Error finalizing recording: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsProcessing(false);
      cleanup();
    }
  }, [isRecording, cleanup, processAudio]);

  // Reset transcript function
  const resetTranscript = useCallback(() => {
    setTranscript({
      text: '',
      segments: [],
    });
    setError(null);
  }, []);

  return {
    transcript,
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    error,
    resetTranscript,
  };
} 