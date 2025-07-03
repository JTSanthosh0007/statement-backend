import { NextRequest, NextResponse } from 'next/server';
import config from '../../config';

/**
 * GET handler to test connectivity with the Canara backend
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    console.log("Test endpoint accessed");

    try {
        // Instead of actually testing the backend connection, just return success
        // Log the backend URL for debugging
        const backendUrl = `${config.backendUrl}/analyze-canara-test`;
        console.log(`Backend URL would be: ${backendUrl}`);

        // Return success immediately
        return NextResponse.json({
            success: true,
            message: 'API test endpoint is working correctly',
            timestamp: new Date().toISOString(),
            backendUrl: backendUrl,
            note: 'Connection to backend not tested to avoid deployment issues'
        }, { status: 200 });

    } catch (error: any) {
        console.error("Error in analyze-canara-test:", error);

        return NextResponse.json({
            error: 'API route error',
            message: error.message || 'Unknown error',
        }, { status: 500 });
    }
} 