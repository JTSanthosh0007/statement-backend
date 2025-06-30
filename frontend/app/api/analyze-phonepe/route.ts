import { NextRequest, NextResponse } from 'next/server';
import config from '../../config';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Forward the raw request body and headers to the backend
    const backendUrl = `${config.backendUrl}/analyze-phonepe`;

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: Object.fromEntries(request.headers), // Forward all headers
      body: request.body, // Forward the raw body stream
      duplex: 'half', // Required for Node.js fetch streaming
    } as any);

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      // If response is not JSON, return a generic error
      return NextResponse.json(
        { error: 'Backend did not return valid JSON', details: await response.text() },
        { status: 500 }
      );
    }

    // Return the backend response with the same status
    return NextResponse.json(data, { status: response.status });

  } catch (error: any) {
    console.error('Error proxying PhonePe request to backend:', error);
    return NextResponse.json(
      {
        error: 'Failed to connect to PhonePe analysis service',
        details: error.message || String(error)
      },
      { status: 500 }
    );
  }
} 