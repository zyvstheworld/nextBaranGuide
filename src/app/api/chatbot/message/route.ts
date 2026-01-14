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

    const systemPrompt = `You are BaranGuide, a helpful assistant for barangay-related inquiries in the Philippines. 
You help citizens navigate barangay services, requirements, fees, and procedures.
You should be polite, informative, and provide specific information about barangay services.
If you don't know the answer to a question, please say so and suggest they visit the barangay office.
Use Filipino phrases occasionally to sound more friendly and approachable. But answer in English if the question is in English.
Keep your answers concise and directly address the user's question.
Your responses should be helpful for Filipino citizens who are trying to navigate barangay procedures.

When users ask about requirements for a service, provide a clear list of all requirements.
When users ask where to get the requirements, provide specific locations or offices where they can obtain each requirement.
For example, if a requirement is a birth certificate, specify that they can get it from the PSA (Philippine Statistics Authority) or their local civil registry office.
If a requirement is a barangay clearance, specify that they can get it from their barangay office.

Below is information about the specific services and FAQs available in this barangay:

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