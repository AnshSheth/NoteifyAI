import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define expected segment structure from OpenAI
interface OpenAISegment {
    id: number;
    seek: number;
    start: number;
    end: number;
    text: string;
    tokens: number[];
    temperature: number;
    avg_logprob: number;
    compression_ratio: number;
    no_speech_prob: number;
}

// Define the structure we want to return
interface ResponseSegment {
  id: string;
  start: number;
  end: number;
  text: string;
}

export async function POST(req: NextRequest) {
  console.log("=== TRANSCRIBE CHUNK API REQUEST RECEIVED ===");
  const tempDir = os.tmpdir();
  let tempFilePath: string | null = null;

  try {
    // Check for multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const timestampStr = formData.get('timestamp') as string | null;
    
    // Validate inputs
    if (!file) {
      console.error('transcribe-chunk: No audio file provided');
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }
    
    if (!timestampStr) {
      console.error('transcribe-chunk: No timestamp provided');
      return NextResponse.json({ error: 'No timestamp provided' }, { status: 400 });
    }
    
    console.log(`transcribe-chunk: Received file: ${file.name}, size: ${file.size}, type: ${file.type}`);
    console.log(`transcribe-chunk: Received timestamp offset: ${timestampStr}ms`);

    // Convert timestamp to seconds
    const timeOffsetSeconds = parseInt(timestampStr, 10) / 1000;
    if (isNaN(timeOffsetSeconds)) {
      console.error('transcribe-chunk: Invalid timestamp format');
      return NextResponse.json({ error: 'Invalid timestamp format' }, { status: 400 });
    }
    
    // Create a buffer from the file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Create a temporary file for the audio
    const fileExt = path.extname(file.name) || '.webm';
    tempFilePath = path.join(tempDir, `audio-${Date.now()}${fileExt}`);
    console.log(`transcribe-chunk: Saving audio to: ${tempFilePath}`);
    
    // Use synchronous writeFileSync to ensure file is written before continuing
    fs.writeFileSync(tempFilePath, buffer);
    
    // Check that file exists and has content
    const stats = fs.statSync(tempFilePath);
    console.log(`transcribe-chunk: File created, size: ${stats.size} bytes`);
    
    if (stats.size < 100) {
      return NextResponse.json({ error: 'Audio file too small or empty' }, { status: 400 });
    }
    
    // Send directly to Whisper API
    console.log("transcribe-chunk: Sending audio to Whisper API...");
    
    // Create a file object from the file path
    const fileStream = fs.createReadStream(tempFilePath);
    
    // Send to OpenAI
    const transcription = await openai.audio.transcriptions.create({
      file: fileStream,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
      language: 'en', 
    });
    
    console.log("transcribe-chunk: Whisper API response received");
    
    // Process segments to add ID and adjust timestamps
    const openAiSegments = (transcription.segments || []) as OpenAISegment[];
    console.log(`transcribe-chunk: Processing ${openAiSegments.length} segments from OpenAI`);
    
    // If no segments but we have text, create a single segment
    if (openAiSegments.length === 0 && transcription.text.trim()) {
      console.log(`transcribe-chunk: No segments but text exists. Creating a single segment`);
      const responseSegments: ResponseSegment[] = [{
        id: 'temp-0',
        start: timeOffsetSeconds,
        end: timeOffsetSeconds + 2, // Estimate 2 seconds
        text: transcription.text.trim(),
      }];
      
      return NextResponse.json({
        text: transcription.text,
        segments: responseSegments,
      });
    }
    
    const responseSegments: ResponseSegment[] = openAiSegments.map((segment) => ({
      id: 'temp-' + segment.id,
      start: segment.start + timeOffsetSeconds,
      end: segment.end + timeOffsetSeconds,
      text: segment.text.trim(),
    }));
    
    // Return the transcription
    const responsePayload = {
      text: transcription.text,
      segments: responseSegments,
    };
    
    console.log("transcribe-chunk: Transcription successful:", 
      transcription.text ? transcription.text.substring(0, 50) + "..." : "No text");
    
    return NextResponse.json(responsePayload);
    
  } catch (error: unknown) {
    console.error('transcribe-chunk: Transcription error:', error);
    
    return NextResponse.json(
      { 
        error: `Transcription failed: ${error instanceof Error ? error.message : String(error)}`,
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      }, 
      { status: 500 }
    );
  } finally {
    // Clean up temp file
    try {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
        console.log(`transcribe-chunk: Cleaned up temp file: ${tempFilePath}`);
      }
    } catch (cleanupError) {
      console.error('transcribe-chunk: Error during cleanup:', cleanupError);
    }
  }
}

// This config doesn't work in Next.js App Router, route handlers automatically parse the request
// We need to handle file size limits differently if needed 