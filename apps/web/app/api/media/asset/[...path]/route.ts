import { NextRequest } from 'next/server';
import { buildApiUrl } from '@/lib/api-base';

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  const storageKey = params.path.join('/');
  const backendUrl = buildApiUrl(`/media/asset/${storageKey}`);

  const response = await fetch(backendUrl, {
    method: 'GET',
    headers: {
      // Forward original headers that may be relevant (e.g. cookies for auth if required)
      cookie: request.headers.get('cookie') ?? '',
    },
    redirect: 'manual',
  });

  // Handle redirects from backend (e.g., signed URLs)
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location');
    if (location) {
      return Response.redirect(location, response.status);
    }
  }

  const responseHeaders = new Headers(response.headers);
  // Remove hop-by-hop headers that Next.js will manage
  responseHeaders.delete('transfer-encoding');
  responseHeaders.delete('content-encoding');

  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}

