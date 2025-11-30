import { NextRequest } from 'next/server';
import { proxyPost } from '@/lib/bff-helper';

export async function POST(request: NextRequest) {
  return proxyPost(request, '/chat/message', false);
}


