import { NextRequest, NextResponse } from 'next/server';

// Backend API URL
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversation_history = [] } = body;

    // Validate input
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input', message: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Call backend chat API
    const messages = [
      ...conversation_history.map((msg: any) => ({
        role: msg.role === 'model' ? 'model' : 'user',
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ];

    const backendResponse = await fetch(`${BACKEND_URL}/api/v1/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: messages
      }),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.text();
      console.error('Backend chat error:', errorData);
      return NextResponse.json(
        { 
          error: 'Backend request failed', 
          message: 'Unable to connect to AI service. Please try again.',
          details: process.env.NODE_ENV === 'development' ? errorData : undefined
        },
        { status: backendResponse.status }
      );
    }

    // Parse JSON response from backend
    const data = await backendResponse.json();
    const fullResponse = data.response || data.message || '';

    return NextResponse.json({
      response: fullResponse,
      message: fullResponse,
      success: true,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Chat API Error:', error);

    let errorMessage = 'I apologize, but I encountered an error. Please try again.';
    let statusCode = 500;

    if (error.message?.includes('fetch') || error.message?.includes('ECONNREFUSED')) {
      errorMessage = '🌐 **Backend Service Unavailable**\n\nUnable to connect to the AI service. Please ensure the backend is running and try again.';
      statusCode = 503;
    }

    return NextResponse.json(
      {
        error: 'Chat request failed',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        success: false,
        retryable: statusCode !== 400
      },
      { status: statusCode }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
