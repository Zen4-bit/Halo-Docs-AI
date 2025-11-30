import { NextRequest } from 'next/server';
import { proxyFormData } from '@/lib/bff-helper';

export async function POST(request: NextRequest) {
  return proxyFormData(request, '/api/tools/add-page-numbers');
}
