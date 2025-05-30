
// src/app/api/lab-tests/route.ts
import { NextResponse } from 'next/server';
import { getManagedLabTests } from '@/lib/data/labTests';

export async function GET() {
  const labTests = getManagedLabTests();
  return NextResponse.json(labTests, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
    },
  });
}
