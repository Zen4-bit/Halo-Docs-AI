import { NextRequest, NextResponse } from 'next/server';

// Use base URL without path - backend routes are at /api/ai/*
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080').replace(/\/api\/v\d+$/, '').replace(/\/api$/, '');

export async function POST(req: NextRequest) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    try {
        const formData = await req.formData();
        
        const response = await fetch(`${API_BASE}/api/ai/image-studio/enhance-prompt`, {
            method: 'POST',
            body: formData,
            signal: controller.signal,
        });

        clearTimeout(timeout);

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch {
            return NextResponse.json({ enhanced: text });
        }

        if (!response.ok) {
            return NextResponse.json(
                { error: data.detail || data.error || 'Prompt enhancement failed' },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error: any) {
        clearTimeout(timeout);
        console.error('Image Studio Enhance Error:', error);
        if (error.name === 'AbortError') {
            return NextResponse.json({ error: 'Request timed out' }, { status: 504 });
        }
        return NextResponse.json(
            { error: error.message || 'Failed to enhance prompt' },
            { status: 500 }
        );
    }
}
