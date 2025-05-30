
// src/app/api/lab-tests/route.ts
import { NextResponse } from 'next/server';
import { getManagedLabTests } from '@/lib/data/labTests';

export async function GET() {
  // Ensure getManagedLabTests can run server-side or handle window check internally
  // For this prototype, it reads from localStorage, so this API is best called client-side.
  // If called server-side without localStorage, it would return initialLabTests.
  const labTests = getManagedLabTests();
  return NextResponse.json(labTests);
}
