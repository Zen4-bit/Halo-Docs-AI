import { NextRequest } from 'next/server';
import { proxyFormData } from '@/lib/bff-helper';
import { TOOL_ENDPOINTS } from '@/lib/tool-endpoints';

export async function POST(request: NextRequest) {
  return proxyFormData(request, TOOL_ENDPOINTS.EXCEL_TO_PDF);
}
