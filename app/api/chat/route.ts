import { NextRequest, NextResponse } from 'next/server';
import { queryRAG } from '@/lib/rag';

export async function POST(request: NextRequest) {
  try {
    // 환경 변수 확인
    if (!process.env.GEMINI_API_KEY) {
      console.error('Missing GEMINI_API_KEY');
      return NextResponse.json(
        { error: 'Server configuration error: Missing API key' },
        { status: 500 }
      );
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('Missing NEXT_PUBLIC_SUPABASE_URL');
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase URL' },
        { status: 500 }
      );
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase key' },
        { status: 500 }
      );
    }

    const { question } = await request.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    console.log('Processing question:', question.substring(0, 50) + '...');

    const response = await queryRAG(question);

    console.log('RAG response generated successfully');

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in chat API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to process question: ${errorMessage}` },
      { status: 500 }
    );
  }
}
