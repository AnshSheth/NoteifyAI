'use client';

import { useState, useEffect, useRef } from 'react';
import { usePythonWhisperTranscription } from '@/hooks/usePythonWhisperTranscription';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function PythonDemoPage() {
  const {
    transcription,
    isRecording,
    error,
    startRecording,
    stopRecording,
    resetTranscription,
    isModelLoaded
  } = usePythonWhisperTranscription();
  
  const [debugMessages, setDebugMessages] = useState<string[]>([]);
  const debugRef = useRef<HTMLDivElement>(null);
  
  // Capture console.log for debugging
  useEffect(() => {
    const originalConsoleLog = console.log;
    
    console.log = (...args) => {
      originalConsoleLog(...args);
      setDebugMessages(prev => [...prev, args.join(' ')].slice(-100)); // Keep last 100 messages
    };
    
    return () => {
      console.log = originalConsoleLog;
    };
  }, []);
  
  // Auto-scroll debug log
  useEffect(() => {
    if (debugRef.current) {
      debugRef.current.scrollTop = debugRef.current.scrollHeight;
    }
  }, [debugMessages]);
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Python-style Whisper Transcription Demo</h1>
      
      <Card className="p-6 space-y-4">
        <div className="flex gap-4">
          <Button 
            onClick={isRecording ? stopRecording : startRecording}
            variant={isRecording ? "destructive" : "default"}
            className="w-32"
          >
            {isRecording ? "Stop" : "Start"} Recording
          </Button>
          
          <Button 
            onClick={resetTranscription} 
            variant="outline"
            disabled={isRecording}
          >
            Reset
          </Button>
        </div>
        
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Status</h2>
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
            <span>{isRecording ? 'Recording...' : 'Not Recording'}</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className={`h-3 w-3 rounded-full ${isModelLoaded ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span>{isModelLoaded ? 'Model Ready' : 'Model Loading...'}</span>
          </div>
          {error && (
            <div className="mt-2 text-red-500">
              Error: {error}
            </div>
          )}
        </div>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Live Transcription</h2>
          <div className="border rounded-md p-4 min-h-[400px] max-h-[400px] overflow-y-auto bg-gray-50">
            {transcription.length > 0 ? (
              <div className="space-y-2">
                {transcription.map((segment, index) => (
                  <p key={index} className="text-lg">
                    {segment.text}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">
                {isRecording ? "Listening..." : "Start recording to see transcription here"}
              </p>
            )}
          </div>
        </Card>
        
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Log</h2>
          <div 
            ref={debugRef}
            className="border rounded-md p-4 min-h-[400px] max-h-[400px] overflow-y-auto font-mono text-xs bg-black text-green-400"
          >
            {debugMessages.map((message, index) => (
              <div key={index} className="whitespace-pre-wrap">
                {message}
              </div>
            ))}
            {debugMessages.length === 0 && (
              <p className="text-gray-500">No debug messages yet</p>
            )}
          </div>
        </Card>
      </div>
      
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">How It Works</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Records audio in small chunks (2 seconds each)</li>
          <li>Accumulates audio data for the current phrase</li>
          <li>If silence is detected for 3 seconds, considers the phrase complete</li>
          <li>Sends audio to dedicated Python-style OpenAI Whisper API endpoint</li>
          <li>Updates the transcript in real-time as you speak</li>
          <li>Finalizes phrases when a natural pause is detected</li>
        </ul>
      </Card>
    </div>
  );
} 