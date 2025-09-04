import { NextResponse } from "next/server";
import { Logger } from "@/utils/logger";
import { analytics } from "@/utils/analytics";
import { preferencesManager } from "@/utils/preferencesManager";

const logger = new Logger("API:Analytics");

/**
 * GET /api/analytics - Get analytics data
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'summary';

    logger.info("GET /api/analytics - Fetching analytics", { type });

    let responseData;

    switch (type) {
      case 'summary':
        responseData = analytics.getAnalyticsSummary();
        break;
      case 'full':
        responseData = analytics.getAnalytics();
        break;
      case 'usage':
        responseData = analytics.getModelUsageStats();
        break;
      case 'preferences':
        responseData = preferencesManager.getPreferenceStats();
        break;
      default:
        return NextResponse.json(
          { error: "Invalid type parameter. Use: summary, full, usage, or preferences" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      type,
      data: responseData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error("GET /api/analytics - Failed to fetch analytics", {
      error: error instanceof Error ? error.message : "Unknown error"
    });

    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/analytics - Reset analytics data
 */
export async function DELETE() {
  try {
    logger.info("DELETE /api/analytics - Resetting analytics");

    analytics.resetAnalytics();

    return NextResponse.json({
      message: "Analytics data reset successfully",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error("DELETE /api/analytics - Failed to reset analytics", {
      error: error instanceof Error ? error.message : "Unknown error"
    });

    return NextResponse.json(
      { error: "Failed to reset analytics" },
      { status: 500 }
    );
  }
}
