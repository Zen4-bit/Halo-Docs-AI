import { NextRequest, NextResponse } from 'next/server';

// Use base URL without path - backend routes are at /api/ai/*
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080').replace(/\/api\/v\d+$/, '').replace(/\/api$/, '');

export async function POST(req: NextRequest) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180000); // 3 minute timeout for image generation

    try {
        const contentType = req.headers.get('content-type') || '';
        let formData: FormData;

        if (contentType.includes('multipart/form-data')) {
            formData = await req.formData();
        } else {
            // Handle JSON requests
            const body = await req.json();
            formData = new FormData();
            formData.append('prompt', body.prompt || '');
            formData.append('style', body.style || 'realistic');
            formData.append('enhance_prompt', String(body.enhance_prompt !== false));
            formData.append('width', String(body.width || 1024));
            formData.append('height', String(body.height || 1024));
            formData.append('negative_prompt', body.negative_prompt || '');
        }

        const response = await fetch(`${API_BASE}/api/ai/image-studio/generate`, {
            method: 'POST',
            body: formData,
            signal: controller.signal,
        });

        clearTimeout(timeout);

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { error: data.detail || data.error || 'Image generation failed' },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error: any) {
        clearTimeout(timeout);
        console.error('Image generation API error:', error);
        
        if (error.name === 'AbortError') {
            return NextResponse.json(
                { error: 'Request timed out. Image generation may take longer for complex prompts.' },
                { status: 504 }
            );
        }
        
        return NextResponse.json(
            { error: error.message || 'Failed to generate image' },
            { status: 500 }
        );
    }
}
