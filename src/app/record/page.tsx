'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRealtimeTranscription } from '@/hooks/useRealtimeTranscription'; // Changed to use RealtimeTranscription
import { Chat } from '@/components/Chat';

// Add a simple utility to handle basic bullet point formatting
const formatNotesContent = (text: string) => {
  if (!text) return '';
  
  // Replace bold text first (process ** formatting)
  const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Process lines with bullet points and indentation
  return formattedText
    .split('\n')
    .map(line => {
      // Process bold formatting within lines
      // Apply proper indentation based on bullet points
      if (line.startsWith('- ')) {
        return `<div class="ml-0 mb-1">${line}</div>`;
      } else if (line.startsWith('  - ') || line.startsWith('    - ')) {
        return `<div class="ml-6 mb-1">${line}</div>`;
      } else if (line.startsWith('      - ') || line.startsWith('        - ')) {
        return `<div class="ml-12 mb-1">${line}</div>`;
      }
      return `<div>${line}</div>`;
    })
    .join('');
};

export default function RecordPage() {
  // Use the RealtimeTranscription hook
  const { 
    transcript,
    interimTranscript,
    notes: generatedNotes,
    isRecording, 
    isGeneratingNotes,
    error, 
    startRecording, 
    stopRecording, 
    resetTranscript,
    triggerNotesGeneration
  } = useRealtimeTranscription();
  
  const [notes, setNotes] = useState<string>('');
  
  // Refs for the transcript segments
  const transcriptSegmentsRef = useRef<{timestamp: string; text: string}[]>([]);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);
  
  // Reset when recording starts
  useEffect(() => {
    if (isRecording) {
      startTimeRef.current = Date.now();
      transcriptSegmentsRef.current = [];
      if (transcriptContainerRef.current) {
        // Only remove transcript segments, not debug elements
        const segments = transcriptContainerRef.current.querySelectorAll('.transcript-segment');
        segments.forEach(segment => segment.remove());
      }
    }
  }, [isRecording]);
  
  // Remove interim-driven update and use finalized transcript to update UI every 5 seconds
  // EFFECT: Add new transcript segments when the finalized transcript array changes
  useEffect(() => {
    if (!transcriptContainerRef.current) return;
    if (transcriptSegmentsRef.current.length === transcript.length) return; // No new segments
    if (transcript.length === 0) return;

    // Find newly added segments (those beyond current ref length)
    const newSegments = transcript.slice(transcriptSegmentsRef.current.length);

    const container = transcriptContainerRef.current;
    // Clear placeholder if needed
    const placeholder = container.querySelector('.transcript-placeholder');
    if (placeholder) placeholder.remove();

    newSegments.forEach(seg => {
      // Store to ref list
      transcriptSegmentsRef.current.push(seg);

      // Create DOM for segment
      const segmentEl = document.createElement('div');
      segmentEl.className = 'transcript-segment flex p-2 mb-2 bg-gray-50 rounded border border-gray-200';

      const timeElement = document.createElement('div');
      timeElement.className = 'w-12 flex-shrink-0 font-medium text-gray-500';
      timeElement.textContent = seg.timestamp;

      const textElement = document.createElement('div');
      textElement.className = 'flex-grow ml-3';
      textElement.textContent = seg.text;

      segmentEl.appendChild(timeElement);
      segmentEl.appendChild(textElement);

      container.appendChild(segmentEl);
      console.log(`Added transcript segment: ${seg.timestamp} - "${seg.text}"`);
    });

    // Scroll to bottom after adding
    container.scrollTop = container.scrollHeight;
  }, [transcript]);
  
  // Update notes when generatedNotes change
  useEffect(() => {
    if (generatedNotes) {
      setNotes(generatedNotes);
    }
  }, [generatedNotes]);
  
  // Reset transcript
  const handleReset = () => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.innerHTML = '';
      
      // Add placeholder
      const placeholder = document.createElement('p');
      placeholder.className = 'transcript-placeholder text-gray-400 italic';
      placeholder.textContent = 'Start speaking to see transcription...';
      transcriptContainerRef.current.appendChild(placeholder);
    }
    resetTranscript();
    transcriptSegmentsRef.current = [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-6">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold flex items-center">
              <span className="text-gray-900">Noteify</span>
              <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">AI</span>
            </Link>
          </div>
        </header>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Lecture Transcription & Notes</h1>
          <p className="text-gray-600">
            Press the button to start recording. Your lecture will be transcribed in real-time.
          </p>
        </div>

        {/* Main Card - Recording UI & Controls */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          {/* Recording UI */}
          <div className="flex flex-col items-center py-6">
            {/* Recording Button */}
            <button 
              onClick={isRecording ? stopRecording : startRecording}
              className={`
                px-8 py-4 rounded-full transition-all duration-300 
                flex items-center justify-center gap-2
                font-medium text-base shadow-lg hover:shadow-xl
                ${isRecording 
                  ? "bg-red-500 hover:bg-red-600 text-white" 
                  : "bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-105"
                }
                ${isRecording ? "animate-pulse" : ""}
              `}
            >
              {isRecording ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="2" strokeWidth="2" />
                  </svg>
                  <span>Stop Recording</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <span>Start Recording</span>
                </>
              )}
            </button>

            {/* Status Text */}
            <div className="mt-4 text-center">
              <p className="text-lg font-medium">
                {isRecording ? "Recording..." : "Ready to record"}
              </p>
              {isRecording && interimTranscript && (
                <p className="text-sm text-blue-500 italic mt-2">{interimTranscript}</p>
              )}
            </div>
          </div>

          {/* Controls */}
          {(transcriptSegmentsRef.current.length > 0 || error) && (
            <div className="flex justify-center mt-6">
              <Button
                onClick={handleReset}
                disabled={isRecording}
              >
                Reset Session
              </Button>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-6 p-4 border border-red-300 bg-red-50 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.707-4.293a1 1 0 001.414 0L10 12.414l.293.293a1 1 0 001.414-1.414L11.414 11l.293-.293a1 1 0 00-1.414-1.414L10 9.586l-.293-.293a1 1 0 00-1.414 1.414L9.586 11l-.293.293a1 1 0 000 1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error Occurred</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Transcription & Notes Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Transcription Column */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <svg className="h-5 w-5 mr-2 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              Transcript
            </h2>
            
            {/* Transcript Container */}
            <div 
              ref={transcriptContainerRef}
              className="bg-gray-50 rounded-md p-6 border border-gray-200 mb-4 min-h-[300px] max-h-[500px] overflow-y-auto"
            >
              <p className="transcript-placeholder text-gray-400 italic">
                {isRecording ? "Listening..." : "Start speaking to see transcription..."} 
              </p>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button 
                onClick={() => {
                  if (transcriptContainerRef.current) {
                    const text = transcriptContainerRef.current.innerText;
                    navigator.clipboard.writeText(text);
                  }
                }}
                className={`
                  inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors
                `}
              >
                <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
                Copy Transcript
              </button>
            </div>
          </div>

          {/* AI Notes Column */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <svg className="h-5 w-5 mr-2 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 12l2.846.813a4.5 4.5 0 013.09 3.09L24 18.75l-.813-2.846a4.5 4.5 0 01-3.09-3.09L18.259 12zm0 0l-2.846-.813a4.5 4.5 0 01-3.09-3.09L10.5 5.25l.813 2.846a4.5 4.5 0 013.09 3.09L18.259 12z" />
                </svg>
                Lecture Summary
                {isGeneratingNotes && (
                  <span className="ml-2 text-sm text-gray-500 italic">(Generating...)</span>
                )}
              </h2>
              
              {/* Generate Notes Button */}
              <button
                onClick={triggerNotesGeneration}
                disabled={isGeneratingNotes}
                className={`
                  inline-flex items-center px-4 py-2 border border-indigo-500 bg-indigo-50 shadow-sm text-sm font-medium rounded-md text-indigo-700 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors
                  ${isGeneratingNotes ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <svg className="-ml-1 mr-2 h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 12l2.846.813a4.5 4.5 0 013.09 3.09L24 18.75l-.813-2.846a4.5 4.5 0 01-3.09-3.09L18.259 12zm0 0l-2.846-.813a4.5 4.5 0 01-3.09-3.09L10.5 5.25l.813 2.846a4.5 4.5 0 013.09 3.09L18.259 12z" />
                </svg>
                Generate Notes
              </button>
            </div>
            
            <div className="bg-gray-50 rounded-md p-6 border border-gray-200 min-h-[300px] max-h-[500px] overflow-y-auto">
              {isGeneratingNotes && !notes && (
                <div className="flex items-center justify-center h-full">
                  <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="ml-2 text-gray-500">Generating notes...</span>
                </div>
              )}
              {notes ? (
                <div 
                  className="text-gray-800 font-sans leading-relaxed" 
                  dangerouslySetInnerHTML={{ __html: formatNotesContent(notes) }}
                />
              ) : (
                !isGeneratingNotes && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <svg className="h-10 w-10 text-gray-300 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 12l2.846.813a4.5 4.5 0 013.09 3.09L24 18.75l-.813-2.846a4.5 4.5 0 01-3.09-3.09L18.259 12zm0 0l-2.846-.813a4.5 4.5 0 01-3.09-3.09L10.5 5.25l.813 2.846a4.5 4.5 0 013.09 3.09L18.259 12z" />
                    </svg>
                    <span className="text-gray-400 italic">Click &quot;Generate Notes&quot; to create an outline from your transcript</span>
                  </div>
                )
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(notes);
                }}
                disabled={!notes || isGeneratingNotes}
                className={`
                  inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors
                  ${(!notes || isGeneratingNotes) ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
                Copy Notes
              </button>
            </div>
          </div>
        </div>

        {/* Chat Section */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="grid grid-cols-1 h-[450px]">
            <Chat transcript={transcript} />
          </div>
        </div>
      </div>
    </div>
  );
}