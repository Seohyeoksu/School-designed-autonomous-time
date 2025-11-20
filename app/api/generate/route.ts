import { NextRequest, NextResponse } from 'next/server';
import { generateContent } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { step, data } = body;

    if (!step || !data) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await generateContent(step, data);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Generate API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
