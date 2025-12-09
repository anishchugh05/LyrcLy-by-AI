import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/middleware';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    if (!message) {
      return createErrorResponse('Message is required', 400, 'MISSING_MESSAGE');
    }

    const systemPrompt = `You are a helpful AI songwriting assistant. Help users with their songwriting questions, provide creative suggestions, and offer guidance on lyrics, themes, and song structure. Be encouraging and creative.${context ? `\n\nCurrent song context:\nGenre: ${context.genre}\nVibe: ${context.vibe}\nTheme: ${context.theme}` : ''}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.8,
      max_tokens: 500,
    });

    const reply = completion.choices[0]?.message?.content || 'I could not generate a response.';

    return createSuccessResponse({ reply });
  } catch (error) {
    console.error('Chat error:', error);
    return createErrorResponse('Failed to process chat message', 500, 'CHAT_ERROR');
  }
}
