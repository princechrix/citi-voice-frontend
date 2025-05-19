// import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";

const google = createGoogleGenerativeAI({
  baseURL: "https://generativelanguage.googleapis.com/v1beta",
  apiKey: process.env.GOOGLE_AI_API_KEY,
});

const model = google.languageModel("gemini-1.5-flash");

interface Category {
  id: string;
  name: string;
}

export async function POST(req: Request) {
  try {
    const { description, categories } = await req.json();

    if (!description || !categories || !Array.isArray(categories)) {
      return new Response("Invalid request: description and categories array are required", { status: 400 });
    }

    const categoryNames = categories.map(cat => cat.name).join(", ");

    const systemPrompt = `You are a complaint classification assistant. Your task is to analyze the given complaint and classify it into one of the specified categories. Also generate a concise subject line that summarizes the complaint. Respond with a clean JSON object containing 'category' and 'subject' fields. Do not include any markdown formatting or code blocks.`;

    const { textStream } = await streamText({
      model: model,
      prompt: `Analyze the following complaint and provide:
1. Classification into one of these categories: [${categoryNames}]
2. A concise subject line summarizing the complaint

Respond with a clean JSON object containing 'category' and 'subject' fields. Do not include any markdown formatting or code blocks.

Complaint: ${description}`,
      system: systemPrompt,
    });

    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = '';
        for await (const chunk of textStream) {
          fullResponse += chunk;
        }
        
        try {
          const parsedResponse = JSON.parse(fullResponse);
          const matchedCategory = categories.find(
            cat => cat.name.toLowerCase() === parsedResponse.category.toLowerCase()
          );

          if (matchedCategory) {
            controller.enqueue(new TextEncoder().encode(JSON.stringify({
              ...matchedCategory,
              subject: parsedResponse.subject
            })));
          } else {
            controller.enqueue(new TextEncoder().encode(JSON.stringify({ 
              error: "No matching category found",
              subject: parsedResponse.subject 
            })));
          }
        } catch (error) {
          controller.enqueue(new TextEncoder().encode(JSON.stringify({ 
            error: "Invalid response format",
            rawResponse: fullResponse 
          })));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error("Error in classification:", error);
    return new Response(JSON.stringify({ error: "Error processing classification request" }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
