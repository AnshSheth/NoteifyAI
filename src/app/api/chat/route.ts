import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Define interfaces for chat messages
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { message, transcript, history } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    // Format the system message with the lecture transcript
    const systemMessage = `You are an AI assistant for a lecture transcription application.
You help users understand the lecture content by answering their questions.
Use the following lecture transcript to answer the user's questions:

${transcript}

When referring to specific parts of the lecture, include the timestamp.
If the answer is not contained in the transcript, politely say that you don't know.
Be concise, helpful, and informative in your responses.`;

    // Convert chat history to OpenAI format
    const previousMessages = history ? history.map((msg: ChatMessage) => ({
      role: msg.role,
      content: msg.content,
    })) : [];

    // Prepare OpenAI chat completion
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemMessage },
        ...previousMessages,
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    // Extract the assistant's reply
    const assistantReply = response.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response.';

    return NextResponse.json({ response: assistantReply });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
} 