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
            response = await fetch(`${API_BASE}/api/ai/summarize`, {
                method: 'POST',
                body: formData,
                signal: controller.signal,
            });
        } else {
            const body = await req.json();
            const formData = new FormData();
            if (body.text) formData.append('text', body.text);
            formData.append('level', body.level || 'medium');
            formData.append('style', body.style || 'paragraph');
            formData.append('language', body.language || 'English');
            formData.append('extract_topics', String(body.extract_topics || false));
            formData.append('extract_sentiment', String(body.extract_sentiment || false));
            formData.append('extract_entities', String(body.extract_entities || false));
            formData.append('stream', String(body.stream || false));

            response = await fetch(`${API_BASE}/api/ai/summarize`, {
                method: 'POST',
                body: formData,
                signal: controller.signal,
            });
        }

        clearTimeout(timeout);

        // Check if streaming response
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
            return NextResponse.json({ summary: text });
        }

        if (!response.ok) {
            return NextResponse.json(
                { error: data.detail || data.error || 'Summary failed' },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error: any) {
        clearTimeout(timeout);
        console.error('Summarize API Error:', error);
        if (error.name === 'AbortError') {
            return NextResponse.json({ error: 'Request timed out' }, { status: 504 });
        }
        return NextResponse.json(
            { error: error.message || 'Failed to summarize' },
            { status: 500 }
        );
    }
}
