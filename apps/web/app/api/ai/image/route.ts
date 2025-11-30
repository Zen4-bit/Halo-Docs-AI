import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        if (!body.prompt) {
            return NextResponse.json(
                { error: 'Prompt is required' },
                { status: 400 }
            );
        }

        // Proxy to Python backend
        const response = await fetch(`${API_BASE}/api/ai/generate-image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: body.prompt,
                aspect_ratio: body.aspectRatio || '1:1',
                style: body.style || 'photographic',
                quantity: body.quantity || 1
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { error: data.detail || data.error || 'Image generation failed' },
                { status: response.status }
            );
        }

        return NextResponse.json(data);

    } catch (error: any) {
        console.error('AI Image Gen Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to connect to AI service' },
            { status: 500 }
        );
    }
}
