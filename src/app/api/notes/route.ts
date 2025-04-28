import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create a system prompt for the note generation
const SYSTEM_PROMPT = `You are a lecture note assistant specialized in creating concise, informative outlines from class transcripts.

Your task is to convert the provided lecture transcript into a focused outline with proper formatting.

Formatting rules (strictly follow these):
- Use ONLY two formatting elements:
  1. **Bold text** for main section titles
  2. Hyphen (-) for bullet points at all levels
- Use indentation for hierarchy (2 spaces per level)
- Main sections should be formatted as: **Section Title**
- Each bullet point should start with "- " (hyphen followed by space)
- Do NOT use any other formatting symbols or markdown

Content guidelines:
- Focus on main ideas and key concepts only
- Be selective and prioritize important points
- Keep bullet points brief (1-2 lines maximum)
- Only include information explicitly mentioned in the transcript
- Do not add external knowledge or explanations

Structure:
- Main sections with **bold titles**
- First level bullets under each section
- Second level bullets (indented) for supporting details
- Third level bullets (further indented) for specific examples if needed

The goal is to produce a clean, focused outline that highlights key points using consistent formatting.`;

export async function POST(request: NextRequest) {
  try {
    // Get request data
    const requestData = await request.json();
    const { session_id, fullTranscript } = requestData;

    if (!session_id || !fullTranscript) {
      console.error("Missing required fields: session_id or fullTranscript");
      return NextResponse.json(
        { error: "Missing required fields: session_id or fullTranscript" },
        { status: 400 }
      );
    }

    console.log(
      `Processing request for session ${session_id} with transcript length: ${fullTranscript.length}`
    );

    // Send to OpenAI to generate notes from transcript
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Updated to GPT-4.1 nano (gpt-4o-mini is the current name)
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user", 
          content: `Here is a lecture transcript with timestamps. Please convert it into well-structured, informative notes that would help a student understand the key concepts:\n\n${fullTranscript}`,
        },
      ],
      temperature: 0.5, // Slightly higher temperature for more descriptive output
      max_tokens: 2500, // Increased to allow for more detailed notes
    });

    // Extract the content from the completion
    const generatedNotes = completion.choices[0].message.content || "";

    console.log(`Successfully generated notes for session ${session_id}`);

    // Return the generated notes
    return NextResponse.json({ updatedNotes: generatedNotes });
  } catch (error: any) {
    console.error("Error generating notes:", error.message);
    return NextResponse.json(
      { error: `Failed to generate notes: ${error.message}` },
      { status: 500 }
    );
  }
} 