import { NextRequest, NextResponse } from 'next/server';
import config from '../../config';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const backendUrl = `${config.backendUrl}/api/analyze-canara`;
    const response = await fetch(backendUrl, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to connect to analysis service', details: error.message || String(error) },
      { status: 500 }
    );
  }
} 