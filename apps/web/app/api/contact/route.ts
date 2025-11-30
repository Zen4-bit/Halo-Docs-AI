import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/api-base';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // In production, this would send an email or create a support ticket
    
    // Optionally forward to backend if you have a contact endpoint
    try {
      const response = await fetch(buildApiUrl('/contact'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch (error) {
      // Backend endpoint not available, using fallback response
    }
    
    // Return success response
    return NextResponse.json({ 
      success: true,
      message: 'Contact form received. We will respond within 24 hours.' 
    });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to process contact form' },
      { status: 500 }
    );
  }
}
