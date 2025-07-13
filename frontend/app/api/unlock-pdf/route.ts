import { NextRequest, NextResponse } from 'next/server'
import config from '../../config'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get the form data from the request
    const formData = await request.formData()
    
    // Forward the request to the actual backend
    const backendUrl = `${config.backendUrl}/unlock-pdf`
    
    console.log(`Forwarding PDF unlock request to backend: ${backendUrl}`)
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      body: formData,
    })

    // Check if PDF was successfully processed
    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(errorData, { status: response.status })
    }

    // If response is a binary file (unlocked PDF), return it as binary
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/pdf')) {
      const arrayBuffer = await response.arrayBuffer()
      return new NextResponse(arrayBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="unlocked.pdf"'
        }
      })
    }
    
    // Otherwise return JSON response
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
    
  } catch (error: any) {
    console.error('Error proxying PDF unlock request to backend:', error)
    return NextResponse.json(
      { 
        error: 'Failed to connect to PDF unlock service',
        details: error.message || String(error)
      },
      { status: 500 }
    )
  }
} 