import { useState, useRef, useCallback, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js' // Import Supabase client
import { v4 as uuidv4 } from 'uuid';

interface TranscriptSegment {
  text: string;
  timestamp: string;
}

// Define interfaces for our hook
interface Segment {
  timestamp: string;
  text: string;
}

interface UseRealtimeTranscriptionResult {
  transcript: Segment[];
  interimTranscript: string;
  notes: string;
  isRecording: boolean;
  isGeneratingNotes: boolean;
  error: string | null;
  startRecording: () => void;
  stopRecording: () => void;
  resetTranscript: () => void;
  triggerNotesGeneration: () => void;
  currentSessionId: string | null;
}

// Define SpeechRecognition interfaces
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onerror: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
}

// Define window interfaces
declare global {
  interface Window {
    SpeechRecognition: {
      new(): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new(): SpeechRecognition;
    };
  }
}

// Initialize Supabase client (replace with your actual URL and anon key)
// Store these in environment variables for security (.env.local)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Please check your .env.local file.');
  // Handle the error appropriately - maybe disable note generation
}

const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// --- Configuration --- 
const NOTE_UPDATE_INTERVAL_MS = 8000; // Update notes every 8 seconds
// -------------------

// Interval for forced timestamp chunks (in milliseconds)
const FORCED_CHUNK_INTERVAL = 5000; // 5 seconds - per user request

export function useRealtimeTranscription(): UseRealtimeTranscriptionResult {
  // State
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<Segment[]>([]);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [notes, setNotes] = useState('');
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  // Refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastTranscriptUpdateRef = useRef<number>(0);
  const pendingTextRef = useRef<string>('');
  const interimTextRef = useRef<string>('');
  const flushIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasFinalResultRef = useRef<boolean>(false);
  const lastProcessedTextRef = useRef<string>(''); // Track last processed text to avoid duplication
  
  // Format time function
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };
  
  // Helper to flush pending transcript into main transcript list
  const flushPending = useCallback(() => {
    const now = Date.now();
    
    // Get text - prefer final results, fall back to interim if needed
    let textToAdd = '';
    if (pendingTextRef.current.trim()) {
      textToAdd = pendingTextRef.current.trim();
      // Clear pending for next batch
      pendingTextRef.current = '';
      hasFinalResultRef.current = false;
    } else if (interimTextRef.current.trim()) {
      // Use interim text if we have no final text
      textToAdd = interimTextRef.current.trim();
    }
    
    if (!textToAdd) return; // Nothing to add
    
    // Handle possible duplicates by checking if this text contains previously processed text
    if (lastProcessedTextRef.current && textToAdd.includes(lastProcessedTextRef.current)) {
      // Extract only the new content after the last processed text
      const newContent = textToAdd.substring(
        textToAdd.indexOf(lastProcessedTextRef.current) + lastProcessedTextRef.current.length
      ).trim();
      
      // If there's no new content, don't add anything
      if (!newContent) {
        console.log('No new content to add, skipping this update');
        return;
      }
      
      // Use only the new content
      textToAdd = newContent;
    }
    
    // Remember what we've processed
    lastProcessedTextRef.current = textToAdd;
    
    // Calculate elapsed time
    const elapsed = (now - startTimeRef.current) / 1000;
    const timestamp = formatTime(elapsed);
    
    // Add to transcript
    setTranscript(prev => [
      ...prev,
      { timestamp, text: textToAdd }
    ]);
    
    console.log(`Added transcript at ${timestamp}: "${textToAdd}"`);
    lastTranscriptUpdateRef.current = now;
    
    // Clear interim since we've handled it
    interimTextRef.current = '';
    setInterimTranscript('');
  }, []);
  
  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check browser support
    if (!('webkitSpeechRecognition' in window) && 
        !('SpeechRecognition' in window)) {
      setError('Speech recognition is not supported in this browser. Try Chrome, Edge, or Safari.');
      return;
    }
    
    // Initialize recognition
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    
    // Configure
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    
    // Set up event handlers
    recognition.onstart = () => {
      console.log('Speech recognition started');
      setIsRecording(true);
      startTimeRef.current = Date.now();
      lastTranscriptUpdateRef.current = Date.now();
      setError(null);
    };
    
    recognition.onerror = (event: Event) => {
      // Cast to unknown first, then to the expected shape
      const errorEvent = event as unknown as { error: string };
      console.error('Speech recognition error', errorEvent.error);
      setError(`Speech recognition error: ${errorEvent.error}`);
      if (errorEvent.error === 'no-speech') {
        // Don't stop on no-speech errors - just warn
        console.log('No speech detected, continuing...');
      } else {
        // Don't call stopRecording directly to avoid circular dependency
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        setIsRecording(false);
      }
    };
    
    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsRecording(false);
      
      // Restart if we're still supposed to be recording
      if (isRecording) {
        console.log('Attempting to restart recognition...');
        try {
          recognition.start();
        } catch (err) {
          console.error('Failed to restart recognition', err);
          setError('Recognition failed to restart. Please try again.');
        }
      }
    };
    
    recognition.onresult = (event: Event) => {
      const speechEvent = event as SpeechRecognitionEvent;
      let currentInterim = '';
      
      // Process latest results
      for (let i = speechEvent.resultIndex; i < speechEvent.results.length; i++) {
        const result = speechEvent.results[i];
        const text = result[0].transcript;
        
        if (result.isFinal) {
          console.log(`Final result: "${text}"`);
          pendingTextRef.current = text;
          hasFinalResultRef.current = true;
        } else {
          currentInterim += text;
        }
      }
      
      // Update interim display
      if (currentInterim) {
        interimTextRef.current = currentInterim;
        setInterimTranscript(currentInterim);
      }
    };
    
    recognitionRef.current = recognition;
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.error('Error stopping recognition on cleanup', err);
        }
      }
    };
  }, []);
  
  // Start recording
  const startRecording = useCallback(() => {
    if (!recognitionRef.current) {
      setError('Speech recognition is not supported or not initialized.');
      return;
    }
    
    try {
      // Generate new session ID
      const sessionId = uuidv4();
      setCurrentSessionId(sessionId);
      
      // Reset state
      setTranscript([]);
      setInterimTranscript('');
      setNotes('');
      setError(null);
      pendingTextRef.current = '';
      interimTextRef.current = '';
      hasFinalResultRef.current = false;
      lastProcessedTextRef.current = ''; // Reset last processed text
      startTimeRef.current = Date.now();
      lastTranscriptUpdateRef.current = Date.now();
      
      // Start recognition
      recognitionRef.current.start();
      
      console.log(`Started recording with session ID: ${sessionId}`);
      
      // Set up forced interval for transcript updates
      flushIntervalRef.current = setInterval(() => {
        flushPending();
      }, FORCED_CHUNK_INTERVAL);
      
    } catch (err) {
      console.error('Error starting recording', err);
      setError(`Failed to start recording: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [flushPending]);
  
  // Stop recording
  const stopRecording = useCallback(() => {
    if (!isRecording) return;
    
    try {
      // Final flush of any pending text
      flushPending();
      
      // Stop recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } catch (err) {
      console.error('Error stopping recording', err);
      setError(`Failed to stop recording: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      if (flushIntervalRef.current) {
        clearInterval(flushIntervalRef.current);
        flushIntervalRef.current = null;
      }
      setIsRecording(false);
    }
  }, [isRecording, flushPending]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (flushIntervalRef.current) {
        clearInterval(flushIntervalRef.current);
      }
    };
  }, []);
  
  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript([]);
    setInterimTranscript('');
    setNotes('');
    setError(null);
    setCurrentSessionId(null);
    pendingTextRef.current = '';
    interimTextRef.current = '';
  }, []);
  
  // Generate notes from transcript
  const triggerNotesGeneration = useCallback(async () => {
    if (transcript.length === 0) {
      setError('No transcript available to generate notes from.');
      return;
    }
    
    try {
      setIsGeneratingNotes(true);
      
      // Format transcript for API
      const fullTranscript = transcript.map(segment => 
        `[${segment.timestamp}] ${segment.text}`
      ).join('\n');
      
      // Call API to generate notes - fix path to match the actual endpoint
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: currentSessionId,
          fullTranscript,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error (${response.status}): ${JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      setNotes(data.updatedNotes);
      console.log('Notes generated successfully');
    } catch (err) {
      console.error('Error generating notes', err);
      setError(`Failed to generate notes: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsGeneratingNotes(false);
    }
  }, [transcript, currentSessionId]);
  
  return {
    transcript,
    interimTranscript,
    notes,
    isRecording,
    isGeneratingNotes,
    error,
    startRecording,
    stopRecording,
    resetTranscript,
    triggerNotesGeneration,
    currentSessionId,
  };
} 