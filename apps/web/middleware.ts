import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger, logAPIError } from './lib/logger';

// Enhanced middleware with error handling and logging
export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  // Log incoming request
  logger.info('Incoming request', {
    requestId,
    method: request.method,
    url: request.url,
    pathname: request.nextUrl.pathname,
    userAgent: request.headers.get('user-agent'),
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
  });

  try {
    // Add request ID to headers for tracking
    const response = NextResponse.next();
    response.headers.set('x-request-id', requestId);
    
    // Log response time
    const duration = Date.now() - startTime;
    logger.info('Request processed', {
      requestId,
      duration,
      pathname: request.nextUrl.pathname,
    });
    
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Log the error with full context
    logAPIError(
      request.nextUrl.pathname,
      request.method,
      500,
      error as Error,
      {
        requestId,
        duration,
        url: request.url,
      }
    );
    
    // Return error response
    return new NextResponse(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'Something went wrong processing your request',
        requestId,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'x-request-id': requestId,
        },
      }
    );
  }
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
