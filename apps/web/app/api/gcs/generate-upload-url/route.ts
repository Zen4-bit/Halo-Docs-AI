import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/api-base';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value 
      || request.headers.get('authorization')?.replace('Bearer ', '');
    const body = await request.json();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(buildApiUrl('/gcs/generate-upload-url'), {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Failed to generate upload URL' },
        { status: response.status }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Generate upload URL error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
