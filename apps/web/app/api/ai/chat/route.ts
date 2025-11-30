import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Use base URL without path - backend routes are at /api/ai/*
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080').replace(/\/api\/v\d+$/, '').replace(/\/api$/, '');

export async function POST(request: NextRequest) {
    console.log('[AI Chat Route] POST request received');
    console.log('[AI Chat Route] API_BASE:', API_BASE);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

    try {
        const contentType = request.headers.get('content-type') || '';
        console.log('[AI Chat Route] Content-Type:', contentType);
        
        let response: Response;

        if (contentType.includes('multipart/form-data')) {
            // Handle file uploads with FormData
            console.log('[AI Chat Route] Processing as multipart/form-data');
            const formData = await request.formData();
            response = await fetch(`${API_BASE}/api/ai/chat`, {
                method: 'POST',
                body: formData,
                signal: controller.signal,
            });
        } else {
            // Handle JSON requests
            console.log('[AI Chat Route] Processing as JSON');
            const body = await request.json();
            console.log('[AI Chat Route] Body message:', body.message);
            const formData = new FormData();
            formData.append('message', body.message || '');
            formData.append('history', JSON.stringify(body.history || []));
            formData.append('personality', body.personality || 'helpful');
            formData.append('temperature', String(body.temperature || 0.7));
            formData.append('stream', String(body.stream || false));
            
            console.log('[AI Chat Route] Calling backend at:', `${API_BASE}/api/ai/chat`);
            response = await fetch(`${API_BASE}/api/ai/chat`, {
                method: 'POST',
                body: formData,
                signal: controller.signal,
            });
            console.log('[AI Chat Route] Backend response status:', response.status);
        }

        clearTimeout(timeout);

        // Check if streaming
        const responseContentType = response.headers.get('content-type') || '';
        
        if (responseContentType.includes('text/event-stream') && response.body) {
            return new NextResponse(response.body, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                },
            });
        }

        // Try to parse as JSON
        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch {
            // If not JSON, return as response text
            return NextResponse.json({ response: text });
        }

        if (!response.ok) {
            return NextResponse.json(
                { error: data.detail || data.error || 'Chat request failed' },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error: any) {
        clearTimeout(timeout);
        console.error('Chat API error:', error);
        
        if (error.name === 'AbortError') {
            return NextResponse.json(
                { error: 'Request timed out. Please try again.' },
                { status: 504 }
            );
        }
        
        return NextResponse.json(
            { error: error.message || 'Failed to connect to AI service' },
            { status: 500 }
        );
    }
}
