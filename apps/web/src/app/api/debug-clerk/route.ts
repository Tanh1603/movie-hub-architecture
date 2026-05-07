import { NextResponse } from 'next/server';

export async function GET() {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || null;
  return NextResponse.json({ publishableKey: key });
}
