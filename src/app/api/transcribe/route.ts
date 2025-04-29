import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { writeFile } from 'fs/promises';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Minimum size for audio to be processed (to avoid sending empty audio)
const MIN_AUDIO_SIZE = 1000; // bytes

export async function POST(req: Request) {
  let filePath = '';
  
  try {
    console.log('[API] Received transcription request');
    
    // Parse the form data from the request
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const startTimestamp = parseInt(formData.get('timestamp') as string) || 0;
    
    // Validate the audio file exists
    if (!file) {
      console.error('[API] No audio file provided in request');
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }
    
    // Log file information
    console.log(`[API] Received file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
    console.log(`[API] Start timestamp: ${startTimestamp}`);
    
    // Check if file size is valid
    if (file.size < MIN_AUDIO_SIZE) {
      console.error(`[API] File too small: ${file.size} bytes`);
      return NextResponse.json({ error: 'Audio file too small to process' }, { status: 400 });
    }
    
    // Create a unique filename - use the same extension as the original
    // Prefer .wav for our new implementation
    let fileExt = '.wav';
    if (file.name) {
      const nameParts = file.name.split('.');
      if (nameParts.length > 1) {
        fileExt = `.${nameParts[nameParts.length - 1]}`;
      }
    }
    
    const filename = `audio-${uuidv4()}${fileExt}`;
    console.log(`[API] Using filename: ${filename}`);
    
    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }
    
    // Write the file to disk
    filePath = path.join(uploadDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);
    
    // Get file information
    const stats = fs.statSync(filePath);
    console.log(`[API] File saved to ${filePath}, size: ${stats.size} bytes`);
    
    // Dump first few bytes for debugging
    const debugBytes = buffer.slice(0, Math.min(44, buffer.length));
    console.log(`[API] File header (first ${debugBytes.length} bytes):`, 
                debugBytes.toString('hex').match(/.{1,2}/g)?.join(' '));
    
    // For WAV files, check RIFF header
    if (fileExt.toLowerCase() === '.wav') {
      const isWav = buffer.slice(0, 4).toString() === 'RIFF' && 
                   buffer.slice(8, 12).toString() === 'WAVE';
      console.log(`[API] WAV header check: ${isWav ? 'Valid' : 'Invalid'}`);
    }
    
    // Send to OpenAI for transcription
    console.log('[API] Sending to OpenAI Whisper API...');
    
    try {
      // Create a file stream to pass to OpenAI
      const fileStream = fs.createReadStream(filePath);
      
      // Get file information for debugging
      fileStream.on('error', (err) => {
        console.error('[API] File stream error:', err);
      });
      
      const transcription = await openai.audio.transcriptions.create({
        file: fileStream,
        model: 'whisper-1',
        response_format: 'verbose_json',
        timestamp_granularities: ['segment'],
        language: 'en',           // Force English language detection
        prompt: 'Transcribe the following audio accurately', // Help guide the model
        temperature: 0.2          // Lower temperature for more accurate results
      });
      
      console.log('[API] Transcription completed successfully');
      
      // Adjust timestamps based on recording offset
      if (transcription.segments) {
        const startTimeMs = startTimestamp;
        
        for (const segment of transcription.segments) {
          // Whisper returns timestamps in seconds, we add the offset (in ms) and convert to ms
          segment.start = startTimeMs / 1000 + segment.start;
          segment.end = startTimeMs / 1000 + segment.end;
        }
      }
      
      return NextResponse.json(transcription);
    } catch (error) {
      console.error("Error transcribing audio:", error);
      return NextResponse.json(
        { error: "Failed to transcribe audio", details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to process request", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    // Clean up the temp file if it exists
    if (filePath && existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`[API] Deleted temporary file: ${filePath}`);
      } catch (e) {
        console.error(`[API] Error deleting temporary file: ${e}`);
      }
    }
  }
} 