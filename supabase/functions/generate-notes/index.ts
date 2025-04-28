// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// @ts-ignore: Deno URL imports are not recognized by TypeScript but work in Supabase Edge Functions
// @deno-types="https://deno.land/std@0.170.0/http/server.ts"
import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
// @ts-ignore: Deno URL imports are not recognized by TypeScript but work in Supabase Edge Functions
// @deno-types="https://esm.sh/openai@4.0.0"
import OpenAI from "https://esm.sh/openai@4.0.0";

// Deno runtime is available in Supabase Edge Functions
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// Initialize OpenAI with API key from environment
const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

// Define request and response types
interface RequestData {
  session_id: string;
  fullTranscript: string;
}

interface ResponseData {
  updatedNotes: string;
  error?: string;
}

interface Request {
  json(): Promise<any>;
}

console.log("Generate Notes Edge Function initialized");

// Create a system prompt for the note generation
const SYSTEM_PROMPT = `You are a highly intelligent note-taking assistant.
Your task is to convert the lecture transcript provided into well-organized, structured notes.
The notes should:
1. Include a clear outline with hierarchical structure (main topics, subtopics)
2. Highlight key concepts, definitions, and principles
3. Be concise but comprehensive
4. Organize information in a logical flow
5. Include bullet points for better readability

Format the notes in markdown for better readability.`;

serve(async (req: Request) => {
  try {
    // Get request data
    const requestData: RequestData = await req.json();
    const { session_id, fullTranscript } = requestData;

    if (!session_id || !fullTranscript) {
      console.error("Missing required fields: session_id or fullTranscript");
      return new Response(
        JSON.stringify({
          error: "Missing required fields: session_id or fullTranscript",
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(
      `Processing request for session ${session_id} with transcript length: ${fullTranscript.length}`
    );

    // Send to OpenAI to generate notes from transcript
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `Here is a lecture transcript. Please convert it into well-structured notes:\n\n${fullTranscript}`,
        },
      ],
      temperature: 0.3, // Lower temperature for more focused, consistent output
      max_tokens: 2000, // Limit response size
    });

    // Extract the content from the completion
    const generatedNotes = completion.choices[0].message.content || "";

    // Prepare response with the generated notes
    const responseData: ResponseData = {
      updatedNotes: generatedNotes,
    };

    console.log(`Successfully generated notes for session ${session_id}`);

    return new Response(JSON.stringify(responseData), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error generating notes:", error instanceof Error ? error.message : String(error));
    return new Response(
      JSON.stringify({
        error: `Failed to generate notes: ${error instanceof Error ? error.message : String(error)}`,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}); 