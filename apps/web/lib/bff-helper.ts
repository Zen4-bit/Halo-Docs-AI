/**
 * Backend-for-Frontend (BFF) Helper
 * Provides reusable functions for proxying requests to FastAPI backend
 */
import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl, API_BASE } from './api-base';

// Direct backend URL - use API_BASE for consistent URL construction
const BACKEND_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080/api/v1';

/**
 * Build URL for tools endpoints
 * Tools endpoints are under the /api/v1 prefix
 */
export function buildToolsUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  // Use the full API base for tools
  return `${BACKEND_BASE.replace(/\/$/, '')}${cleanEndpoint}`;
}

/**
 * Extract auth token from request
 */
export function getAuthToken(request: NextRequest): string | null {
  // Try cookie first (httpOnly)
  const cookieToken = request.cookies.get('auth_token')?.value;
  if (cookieToken) return cookieToken;
  
  // Try Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '');
  }
  
  return null;
}

/**
 * Proxy POST request to backend
 */
export async function proxyPost(
  request: NextRequest,
  backendEndpoint: string,
  requireAuth: boolean = true
): Promise<NextResponse> {
  try {
    const token = getAuthToken(request);
    
    if (requireAuth && !token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const backendUrl = buildApiUrl(backendEndpoint);
    console.log('🔍 Frontend API calling backend URL:', backendUrl);
    console.log('🔍 Backend endpoint:', backendEndpoint);
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || data.error || 'Request failed' },
        { status: response.status }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Proxy error for ${backendEndpoint}:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Proxy GET request to backend
 */
export async function proxyGet(
  request: NextRequest,
  backendEndpoint: string,
  requireAuth: boolean = true
): Promise<NextResponse> {
  try {
    const token = getAuthToken(request);
    
    if (requireAuth && !token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(buildApiUrl(backendEndpoint), {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || data.error || 'Request failed' },
        { status: response.status }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Proxy error for ${backendEndpoint}:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Proxy PUT request to backend
 */
export async function proxyPut(
  request: NextRequest,
  backendEndpoint: string,
  requireAuth: boolean = true
): Promise<NextResponse> {
  try {
    const token = getAuthToken(request);
    
    if (requireAuth && !token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(buildApiUrl(backendEndpoint), {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || data.error || 'Request failed' },
        { status: response.status }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Proxy error for ${backendEndpoint}:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Proxy FormData (file upload) request to backend tools
 * Returns the file response directly for downloads
 */
export async function proxyFormData(
  request: NextRequest,
  toolEndpoint: string
): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const backendUrl = buildToolsUrl(toolEndpoint);
    
    console.log('🔧 Tool request to:', backendUrl);
    console.log('🔧 Tool endpoint:', toolEndpoint);
    
    // Set timeout for the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout
    
    let response: Response;
    try {
      response = await fetch(backendUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timed out. The file may be too large or the server is busy.' },
          { status: 504 }
        );
      }
      // Connection refused or network error
      console.error('🔧 Backend connection error:', fetchError.message);
      return NextResponse.json(
        { error: `Backend service unavailable. Please ensure the backend server is running. (${fetchError.message})` },
        { status: 503 }
      );
    }
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      let errorDetail = 'Processing failed';
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || errorData.error || errorData.message || errorDetail;
      } catch {
        try {
          errorDetail = await response.text() || errorDetail;
        } catch {
          errorDetail = `Server returned status ${response.status}`;
        }
      }
      console.error('🔧 Backend error:', errorDetail);
      return NextResponse.json(
        { error: errorDetail },
        { status: response.status }
      );
    }
    
    // Get the response as blob for file downloads
    const blob = await response.blob();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentDisposition = response.headers.get('content-disposition');
    
    console.log('🔧 Tool response received:', blob.size, 'bytes');
    
    // Create response with file
    const fileResponse = new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        ...(contentDisposition && { 'Content-Disposition': contentDisposition }),
      },
    });
    
    return fileResponse;
  } catch (error: any) {
    console.error(`🔧 Tool proxy error for ${toolEndpoint}:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request. Please try again.' },
      { status: 500 }
    );
  }
}
