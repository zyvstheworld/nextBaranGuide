import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// Function to get con  text from database
async function getDatabaseContext() {
  try {
    // Fetch services from Supabase
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*');

    // Fetch FAQs from Supabase
    const { data: faqs, error: faqsError } = await supabase
      .from('faqs')
      .select('*');

    if (servicesError || faqsError) {
      console.error('Error fetching context:', servicesError || faqsError);
      return "";
    }

    let context = "Here's information about our barangay services and frequently asked questions:\n\n";

    context += "SERVICES:\n";
    services?.forEach(service => {
      context += `Service: ${service.title}\nRequirements: ${service.requirements}\nFee: ${service.price}\nDuration: ${service.duration}\n\n`;
    });

    context += "FREQUENTLY ASKED QUESTIONS:\n";
    faqs?.forEach(faq => {
      context += `Q: ${faq.question}\nA: ${faq.answer}\n\n`;
    });

    return context;
  } catch (error) {
    console.error('Error getting database context:', error);
    return "";
  }
}

// Function to get recent conversation history
async function getConversationHistory(limit = 5) {
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching conversation history:', error);
      return [];
    }

    return messages?.reverse() || [];
  } catch (error) {
    console.error('Error getting conversation history:', error);
    return [];
  }
}

// Function to clean response text
function cleanResponseText(text: string): string {
  return text.replace(/\*/g, '');
}

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const databaseContext = await getDatabaseContext();
    const conversationHistory = await getConversationHistory();

    // Build conversation history string
    let conversationContext = '';
    if (conversationHistory.length > 0) {
      conversationContext = "Previous conversation:\n";
      conversationHistory.forEach(msg => {
        conversationContext += `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      });
      conversationContext += "\n";
    }

    const systemPrompt = `You are BaranGuide, an intelligent assistant designed to help residents and visitors
with barangay-related inquiries in the Philippines, specifically Barangay Old Cabalan in Olongapo City.

Your responsibilities include:
- Answering questions about Barangay Old Cabalan services using official database information
- Providing general guidance on Philippine barangay and government procedures
- Answering general knowledge questions about Olongapo City

Answer Priority Order:
1. Barangay Old Cabalan services and FAQs (use database information exactly)
2. General barangay and Philippine government procedures (AI-generated guidance)
3. General knowledge about Olongapo City (AI-generated public information)
4. If the question is outside these areas, politely explain the limitation

Guidelines:
- Be polite, friendly, and professional
- Use Filipino phrases occasionally (e.g., “po”, “salamat”)
- Answer in English if the question is in English
- Keep responses concise and easy to understand

When generating answers NOT found in the database:
- Clearly state that the information is a general guideline
- Avoid inventing exact fees, schedules, or processing times
- Encourage users to confirm details with the barangay or city office

When listing requirements:
- Use bullet points
- Specify where documents can be obtained (e.g., PSA, Barangay Hall, City Hall)

Below is the official information available in the system database:

${databaseContext}

${conversationContext}

Please respond to the following message from a citizen:`;

    const fullPrompt = `${systemPrompt}\n\nUser: ${message}`;

    try {
      const result = await model.generateContent(fullPrompt);
      const response = cleanResponseText(result.response.text());

      // Save the conversation to Supabase
      await supabase.from('messages').insert([
        { sender: 'user', content: message },
        { sender: 'bot', content: response }
      ]);

      return NextResponse.json({
        data: { response }
      });
    } catch (aiError) {
      console.error('Error with Gemini API:', aiError);

      const fallbackResponse = "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again in a moment or visit your local Barangay office for immediate assistance.";

      // Save the error conversation to Supabase
      await supabase.from('messages').insert([
        { sender: 'user', content: message },
        { sender: 'bot', content: fallbackResponse, is_error: true }
      ]);

      return NextResponse.json({
        data: { response: fallbackResponse }
      });
    }
  } catch (error) {
    console.error('Error generating chat response:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 