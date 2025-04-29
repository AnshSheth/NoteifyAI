'use client';

import { useState, useEffect, useRef } from 'react';
import { useRealtimeTranscription } from '@/hooks/useRealtimeTranscription';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function PythonDemoPage() {
  const {
    transcript,
    interimTranscript,
    isRecording,
    error,
    startRecording,
    stopRecording,
    resetTranscript,
  } = useRealtimeTranscription();
  
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
      <h1 className="text-3xl font-bold">Speech Transcription Demo</h1>
      
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
            onClick={resetTranscript} 
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
            {transcript.length > 0 ? (
              <div className="space-y-2">
                {transcript.map((segment, index) => (
                  <p key={index} className="text-lg">
                    <span className="text-gray-500 font-mono text-sm">[{segment.timestamp}]</span> {segment.text}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">
                {isRecording ? "Listening..." : "Start recording to see transcription here"}
              </p>
            )}
            {isRecording && interimTranscript && (
              <p className="text-blue-500 italic mt-2">{interimTranscript}</p>
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
          <li>Uses Web Speech API for real-time transcription</li>
          <li>Processes speech in chunks with timestamps</li>
          <li>Displays interim results as you speak</li>
          <li>Finalizes phrases when recognition is complete</li>
          <li>Maintains transcript history with timestamps</li>
        </ul>
      </Card>
    </div>
  );
} 