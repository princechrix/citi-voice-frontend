import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { NextResponse } from "next/server";
import { streamText } from "ai";

// import { streamText } from "ai";

const google = createGoogleGenerativeAI({
  baseURL: "https://generativelanguage.googleapis.com/v1beta",
  apiKey: process.env.GOOGLE_AI_API_KEY,
});

const model = google.languageModel("gemini-1.5-flash");

export async function POST(req: Request) {
  try {
    const { message, history, userData, complaints, agencies } = await req.json();

    if (!message) {
      return new Response("Message is required", { status: 400 });
    }

    const complaintsContext = JSON.stringify(complaints);
    const agenciesContext = userData?.role === 'SUPER_ADMIN' ? JSON.stringify(agencies) : '';

    const systemPrompt = `You are CitiAI Assistant, a helpful AI assistant for the CitiVoice platform. Your role is to help users with their complaints and inquiries. You should:
1. Be professional and courteous
2. Provide clear and concise responses
3. Help users understand the complaint process
4. Guide users to the appropriate resources
5. Maintain context from previous messages in the conversation
6. Use the complaints information provided to give more relevant and contextual responses
7. Use the logged in user's information to provide more relevant and contextual responses
9. Please dont say anything that is not related to this system. 
${userData?.role === 'SUPER_ADMIN' ? '8. Use the agencies information to provide insights about agency-related queries' : ''}

the logged in user is:
${JSON.stringify(userData)}

if the user is a super admin, you should provide information about the super admin portal.
if the user is an agency admin, you should provide information about the agency portal.
if the user is a staff, you should provide information about the staff portal.

${userData?.role === 'SUPER_ADMIN' ? `
    Super Admin Portal Information:

Dashboard:
Displays high-level system metrics (e.g., total users, agencies, complaints, categories), recent complaints, and complaint statistics by status and time.

Agencies:
Manage agency records. Includes CRUD operations for agencies and their metadata like acronym, description, logo, and activation status.

Users:
Manage platform users. Includes user listing, creation, role assignment (SUPER_ADMIN, AGENCY_ADMIN, STAFF), activation, verification, and optional agency association.

Complaints Categories:
Manage complaint categories. Supports setting a primary agency, linking secondary agencies, and handling category descriptions.

Complaints:
View and manage citizen-submitted complaints. Includes complaint assignment, tracking, status updates (PENDING, IN_PROGRESS, etc.), history, and responses from staff.

` : userData?.role === 'AGENCY_ADMIN' ? `
Agencies Portal Information:

Dashboard:
Displays high-level system metrics (e.g., total users staff, complaints, categories), recent complaints, and complaint statistics by status and time.

Users:
Manage platform users. Includes user listing, creation, role assignment (AGENCY_ADMIN, STAFF), activation, verification, and optional agency association.

Complaints:
View and manage citizen-submitted complaints. Includes complaint assignment, tracking, status updates (PENDING, IN_PROGRESS, etc.), history, and responses from staff.

` : userData?.role === 'STAFF' ? `
Staff Portal Information:

Dashboard:
Displays high-level system metrics (e.g., total users staff, complaints, categories), recent complaints, and complaint statistics by status and time.

Complaints:
View and manage citizen-submitted complaints. Includes complaint assignment, tracking, status updates (PENDING, IN_PROGRESS, etc.), history, and responses from staff.
${complaintsContext}
` : ''}

${userData?.role === 'SUPER_ADMIN' ? `
Agencies Information:
${agenciesContext}
` : ''}

Complaints Information:
${complaintsContext}

Remember to maintain context from previous messages and provide relevant follow-up information.`;

    const context = history
      .map((msg: any) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
      .join("\n");

    const { textStream } = await streamText({
      model: model,
      prompt: `Previous conversation context:
${context}

Current question: ${message}`,
      system: systemPrompt,
    });

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of textStream) {
          controller.enqueue(new TextEncoder().encode(chunk));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Error in AI chat:", error);
    return new Response("Error processing chat request", { status: 500 });
  }
}
