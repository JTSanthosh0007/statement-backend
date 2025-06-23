import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { writeFile } from 'fs/promises';
import path from 'path';
import os from 'os';
import fs from 'fs';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Prepare form data for backend
    const backendForm = new FormData();
    backendForm.append('file', file);

    // Call the FastAPI backend /analyze-kotak endpoint
    const backendUrl = process.env.BACKEND_URL || 'https://demo-bl6p.onrender.com/analyze-kotak';
    const response = await fetch(backendUrl, {
      method: 'POST',
      body: backendForm,
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error processing statement:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process statement',
        details: error.message
      },
      { status: 500 }
    );
  }
} 