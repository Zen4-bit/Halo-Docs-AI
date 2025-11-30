import { NextRequest, NextResponse } from 'next/server';

// Use base URL without path - backend routes are at /api/ai/*
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080').replace(/\/api\/v\d+$/, '').replace(/\/api$/, '');

export async function POST(req: NextRequest) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    try {
        const contentType = req.headers.get('content-type') || '';
        let response: Response;

        if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData();
            response = await fetch(`${API_BASE}/api/ai/rewrite`, {
                method: 'POST',
                body: formData,
                signal: controller.signal,
            });
        } else {
            const body = await req.json();
            const formData = new FormData();
            formData.append('text', body.text || '');
            formData.append('level', body.level || 'medium');
            formData.append('tone', body.tone || 'neutral');
            formData.append('length_change', body.lengthChange || body.length_change || 'same');
            formData.append('use_emoji', String(body.useEmoji || false));
            formData.append('plagiarism_safe', String(body.plagiarismSafe || false));
            formData.append('stream', String(body.stream || false));
            
            response = await fetch(`${API_BASE}/api/ai/rewrite`, {
                method: 'POST',
                body: formData,
                signal: controller.signal,
            });
        }

        clearTimeout(timeout);

        const respContentType = response.headers.get('content-type') || '';
        if (respContentType.includes('text/event-stream') && response.body) {
            return new NextResponse(response.body, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                },
            });
        }

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch {
            return NextResponse.json({ rewritten: text });
        }

        if (!response.ok) {
            return NextResponse.json(
                { error: data.detail || data.error || 'Rewrite failed' },
                { status: response.status }
            );
        }

        return NextResponse.json(data);

    } catch (error: any) {
        clearTimeout(timeout);
        console.error('AI Rewrite Error:', error);
        if (error.name === 'AbortError') {
            return NextResponse.json({ error: 'Request timed out' }, { status: 504 });
        }
        return NextResponse.json(
            { error: error.message || 'Failed to connect to AI service' },
            { status: 500 }
        );
    }
}
