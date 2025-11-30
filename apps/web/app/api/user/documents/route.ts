import { NextRequest } from 'next/server';
import { proxyGet } from '@/lib/bff-helper';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const skip = searchParams.get('skip') || '0';
  const limit = searchParams.get('limit') || '50';
  
  return proxyGet(request, `/user/documents?skip=${skip}&limit=${limit}`);
}
