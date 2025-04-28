import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Define transcript segment structure
interface TranscriptionSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

interface WhisperOptions {
  language?: string;
  // Add other option fields as needed
}

interface WhisperResponse {
  text: string;
  segments: {
    id: number;
    start: number;
    end: number;
    text: string;
    [key: string]: unknown;
  }[];
  [key: string]: unknown;
}

// Main POST handler for audio transcription
export async function POST(req: NextRequest) {
  console.log('=== PYTHON WHISPER API REQUEST RECEIVED ===');
  
  try {
    // Validate that we received a properly formed request
    const formData = await req.formData();
    
    // Get audio blob
    const audioBlob = formData.get('audio') as Blob | null;
    
    // Validate audio data exists
    if (!audioBlob) {
      console.error('No audio blob found in request');
      return NextResponse.json(
        { error: 'No audio data provided' },
        { status: 400 }
      );
    }
    
    // Log audio details
    console.log(`Audio blob received: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
    
    // Check if audio is too small (likely empty or corrupt)
    if (audioBlob.size < 1000) {
      console.warn(`Audio file size is suspiciously small: ${audioBlob.size} bytes`);
      return NextResponse.json(
        { 
          warning: 'Audio file is too small and may not contain speech',
          text: '',
          segments: []
        },
        { status: 200 }
      );
    }
    
    // Parse any additional options
    let options: WhisperOptions = {};
    try {
      const optionsStr = formData.get('options') as string;
      if (optionsStr) {
        options = JSON.parse(optionsStr);
        console.log('Additional options:', options);
      }
    } catch (err) {
      console.warn('Error parsing options, ignoring:', err);
    }
    
    // Convert Blob to ArrayBuffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    
    // Convert ArrayBuffer to Buffer
    const buffer = Buffer.from(arrayBuffer);
    
    // Create a File with the audio data
    const file = new File([buffer], 'audio.wav', { type: 'audio/wav' });
    
    console.log('Sending audio to Whisper API...');
    
    // Send to OpenAI Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: options.language || 'en',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    });
    
    console.log('Whisper API response received');
    
    // Extract segments
    const segments: TranscriptionSegment[] = ((transcription as unknown) as WhisperResponse).segments.map(segment => ({
      id: segment.id,
      start: segment.start,
      end: segment.end,
      text: segment.text
    }));
    
    // Format and return response
    return NextResponse.json({
      text: transcription.text,
      segments: segments
    });
    
  } catch (error) {
    // Log detailed error for debugging
    console.error('Error in whisper transcription:', error);
    
    // Format error message for response
    const errorMessage = error instanceof Error ? 
      error.message : 
      'Unknown error occurred';
    
    // Return structured error response
    return NextResponse.json(
      { 
        error: `Transcription failed: ${errorMessage}`,
        details: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        } : String(error)
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ status: 'Python-style Whisper API is ready' });
} 