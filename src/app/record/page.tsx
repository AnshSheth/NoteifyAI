'use client';

import { useState, useEffect, useRef } from 'react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import Link from 'next/link';

export default function RecordPage() {
  const [isRecording, setIsRecording] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const { transcript, startRecording, stopRecording, error } = useSpeechRecognition();

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
    setIsRecording(!isRecording);
  };

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100">
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Record Lecture</h1>
            <Link 
              href="/"
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Back to Home
            </Link>
          </div>
          
          <div className="mb-8 flex items-center gap-4">
            <button
              onClick={toggleRecording}
              className={`px-6 py-3 rounded-lg font-medium text-white shadow-md transition-all ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
            {isRecording && (
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-sm text-gray-600">Recording in progress...</span>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          )}

          <div
            ref={transcriptRef}
            className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 h-[60vh] overflow-y-auto"
          >
            {transcript ? (
              <p className="whitespace-pre-wrap text-gray-800">{transcript}</p>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <p className="text-gray-500 text-lg">
                  {isRecording
                    ? 'Listening...'
                    : 'Click "Start Recording" to begin transcription'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 