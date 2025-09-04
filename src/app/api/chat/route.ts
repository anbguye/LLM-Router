import { NextResponse } from "next/server";
import { Logger } from "@/utils/logger";
import { routeAndRespond, getRouterStatus } from "@/utils/router";

const logger = new Logger("API:Chat");

// API constants
const MAX_MESSAGE_LENGTH = 10000; // Maximum allowed message length in characters
const RETRY_AFTER_SECONDS = 60; // Retry after seconds for rate limiting

export interface ChatRequest {
  message: string;
}

export interface ChatApiResponse {
  content: string;
  model: string;
  reasoning: string;
  tokensUsed?: number;
  processingTime: number;
  timestamp: string;
}

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    logger.info("POST /api/chat - Request started");

    // Parse request body
    const body: ChatRequest = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    // Trim and validate message length
    const trimmedMessage = message.trim();
    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message is too long (max ${MAX_MESSAGE_LENGTH} characters)` },
        { status: 400 }
      );
    }

    logger.debug("Processing chat request", {
      messageLength: trimmedMessage.length,
      timestamp: new Date().toISOString()
    });

    // Route and get response from intelligent router
    const response = await routeAndRespond(trimmedMessage);

    const apiResponse: ChatApiResponse = {
      ...response,
      timestamp: new Date().toISOString()
    };

    const totalProcessingTime = Date.now() - startTime;
    logger.info("POST /api/chat - Request completed successfully", {
      model: response.model,
      processingTime: totalProcessingTime,
      tokensUsed: response.tokensUsed
    });

    return NextResponse.json(apiResponse);

  } catch (error) {
    const totalProcessingTime = Date.now() - startTime;

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Rate limit exceeded')) {
        logger.warn("Rate limit exceeded", { processingTime: totalProcessingTime });
        return NextResponse.json(
          {
            error: "Rate limit exceeded. Please wait a moment before sending another message.",
            retryAfter: RETRY_AFTER_SECONDS
          },
          {
            status: 429,
            headers: { 'Retry-After': RETRY_AFTER_SECONDS.toString() }
          }
        );
      }

      if (error.message.includes('All routing attempts failed')) {
        logger.error("All routing attempts failed", {
          error: error.message,
          processingTime: totalProcessingTime
        });
        return NextResponse.json(
          { error: "Service temporarily unavailable. Please try again later." },
          { status: 503 }
        );
      }
    }

    // Generic error handling
    logger.error("POST /api/chat - Request failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      processingTime: totalProcessingTime
    });

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    logger.info("GET /api/chat - Status request");

    const status = getRouterStatus();

    return NextResponse.json({
      status: "operational",
      ...status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error("GET /api/chat - Status request failed", {
      error: error instanceof Error ? error.message : "Unknown error"
    });

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
