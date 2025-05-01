import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    console.log('[Frontend API] Received request:', { messages })

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Frontend API] Backend API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      throw new Error('Failed to get response from AI service')
    }

    // Forward the streaming response
    const stream = response.body
    if (!stream) {
      throw new Error('No response body')
    }

    // Create a new ReadableStream to transform the response
    const transformedStream = new ReadableStream({
      async start(controller) {
        const reader = stream.getReader()
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            
            // Convert the chunk to text
            const chunk = new TextDecoder().decode(value)
            console.log('[Frontend API] Received chunk:', chunk)
            
            // Forward the chunk as is
            controller.enqueue(new TextEncoder().encode(chunk))
          }
        } finally {
          reader.releaseLock()
        }
        controller.close()
      }
    })

    // Return the stream with proper headers
    return new Response(transformedStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    )
  }
}

// Add error handling wrapper
async function parseDataStreamPart(streamPart: string) {
  // Accept a string possibly containing multiple lines like "data: ...\n"
  const dataPrefix = 'data: ';
  return streamPart
    .split('\n')
    .filter(line => line.startsWith(dataPrefix))
    .map(line => {
      const jsonStr = line.slice(dataPrefix.length).trim();
      if (!jsonStr) return null;
      try {
        const parsed = JSON.parse(jsonStr);
        // Transform if needed for @ai-sdk/react
        return {
          content: parsed.code || parsed.content || ''
        };
      } catch (error) {
        console.error('[ERROR] Stream parse failure:', {error, jsonStr});
        return null;
      }
    })
    .filter((item): item is { content: string } => item !== null);
}