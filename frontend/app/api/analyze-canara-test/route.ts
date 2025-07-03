import { NextRequest, NextResponse } from 'next/server';
import config from '../../config';

/**
 * GET handler to test connectivity with the Canara backend
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    console.log("Testing connection to Canara API");

    try {
        // Test the connection to the backend server
        const backendUrl = `${config.backendUrl}/analyze-canara-test`;
        console.log(`Sending test request to: ${backendUrl}`);

        const response = await fetch(backendUrl, {
            method: 'GET',
            cache: 'no-store',
            headers: {
                'Accept': 'application/json',
            },
        });

        console.log(`Backend test response status: ${response.status}`);

        if (!response.ok) {
            console.error(`Backend test failed with status: ${response.status}`);
            return NextResponse.json({
                error: 'Failed to connect to backend service',
                status: response.status,
                statusText: response.statusText
            }, { status: 500 });
        }

        const data = await response.json();
        console.log("Backend test successful:", data);

        return NextResponse.json({
            success: true,
            message: 'Successfully connected to Canara API',
            backendResponse: data
        }, { status: 200 });

    } catch (error: any) {
        console.error("Error testing Canara API connectivity:", error);

        return NextResponse.json({
            error: 'Failed to connect to backend service',
            message: error.message || 'Unknown error',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
} 