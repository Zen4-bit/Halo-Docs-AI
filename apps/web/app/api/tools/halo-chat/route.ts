import { NextRequest } from 'next/server';
import { proxyPost } from '@/lib/bff-helper';
import { TOOL_ENDPOINTS } from '@/lib/tool-endpoints';

export async function POST(request: NextRequest) {
    return proxyPost(request, TOOL_ENDPOINTS.HALO_CHAT, false);
}
