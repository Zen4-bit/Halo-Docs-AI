import { NextRequest, NextResponse } from 'next/server';

// Backend API URL
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

// Image Generation API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      prompt, 
      aspectRatio = '1:1', 
      style = 'photographic',
      quantity = 1,
      negativePrompt = ''
    } = body;

    // Validate input
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input', message: 'Prompt is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate quantity
    const numImages = Math.min(Math.max(parseInt(quantity) || 1, 1), 4); // Limit to 1-4 images

    // Call backend image generation API
    const backendResponse = await fetch(`${BACKEND_URL}/api/v1/ai/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        aspect_ratio: aspectRatio,
        style,
        quantity: numImages,
        negative_prompt: negativePrompt
      }),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.text();
      console.error('Backend image generation error:', errorData);
      return NextResponse.json(
        { 
          error: 'Backend request failed', 
          message: 'Unable to generate image. Please try again.',
          details: process.env.NODE_ENV === 'development' ? errorData : undefined
        },
        { status: backendResponse.status }
      );
    }

    const result = await backendResponse.json();

    return NextResponse.json({
      success: true,
      images: result.images || [],
      metadata: {
        prompt,
        aspectRatio,
        style,
        quantity: numImages,
        model: 'imagen-3.0-generate-001',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Image Generation API Error:', error);

    let errorMessage = 'Failed to generate image. Please try again.';
    let statusCode = 500;

    if (error.message?.includes('fetch') || error.message?.includes('ECONNREFUSED')) {
      errorMessage = '🌐 **Backend Service Unavailable**\n\nUnable to connect to the AI service. Please ensure the backend is running and try again.';
      statusCode = 503;
    }

    return NextResponse.json(
      {
        error: 'Image generation failed',
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
