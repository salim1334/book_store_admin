import { type NextRequest, NextResponse } from 'next/server';

const MOBILE_API_KEY = process.env.MOBILE_API_KEY;

export function validateMobileApiKey(request: NextRequest):
  | { authorId: string }
  | { error: string; status: number } {
  const apiKey = request.headers.get('x-api-key');
  const authorId = request.nextUrl.searchParams.get('authorId');

  if (!MOBILE_API_KEY) {
    return { error: 'Mobile API key not configured', status: 500 };
  }

  if (!apiKey || apiKey !== MOBILE_API_KEY) {
    return { error: 'Invalid or missing API key', status: 401 };
  }

  if (!authorId) {
    return { error: 'Missing authorId query parameter', status: 400 };
  }

  return { authorId };
}

export function mobileUnauthorized(error: string) {
  return NextResponse.json({ error }, { status: 401 });
}
