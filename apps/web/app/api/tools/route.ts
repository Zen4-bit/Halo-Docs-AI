import { buildApiUrl } from '@/lib/api-base';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { path, payload } = body;

    if (typeof path !== 'string' || !path.trim()) {
      return Response.json(
        { error: 'Missing tool path' },
        { status: 400 }
      );
    }

    const targetPath = path.startsWith('/') ? path : `/${path}`;
    const response = await fetch(buildApiUrl(targetPath), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error('Tool API error:', error);
    return Response.json(
      { error: 'Tool execution failed' },
      { status: 500 }
    );
  }
}
