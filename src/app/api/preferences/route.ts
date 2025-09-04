import { NextResponse } from "next/server";
import { Logger } from "@/utils/logger";
import { preferencesManager } from "@/utils/preferencesManager";
import { RoutingPreferences } from "@/config/routingPreferences";

const logger = new Logger("API:Preferences");

export interface PreferencesRequest {
  userId?: string;
  preferences?: Partial<RoutingPreferences>;
}

/**
 * GET /api/preferences - Get user preferences
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default';

    logger.info("GET /api/preferences - Fetching preferences", { userId });

    const preferences = preferencesManager.getUserPreferences(userId);

    return NextResponse.json({
      userId,
      preferences,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error("GET /api/preferences - Failed to fetch preferences", {
      error: error instanceof Error ? error.message : "Unknown error"
    });

    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/preferences - Set user preferences
 */
export async function POST(request: Request) {
  try {
    const body: PreferencesRequest = await request.json();
    const userId = body.userId || 'default';

    if (!body.preferences) {
      return NextResponse.json(
        { error: "Preferences object is required" },
        { status: 400 }
      );
    }

    logger.info("POST /api/preferences - Setting preferences", {
      userId,
      priority: body.preferences.priority
    });

    const updatedPreferences = preferencesManager.setUserPreferences(userId, body.preferences);

    return NextResponse.json({
      userId,
      preferences: updatedPreferences,
      message: "Preferences updated successfully",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error("POST /api/preferences - Failed to set preferences", {
      error: error instanceof Error ? error.message : "Unknown error"
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to set preferences" },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/preferences - Reset user preferences to defaults
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default';

    logger.info("DELETE /api/preferences - Resetting preferences", { userId });

    const defaultPreferences = preferencesManager.resetUserPreferences(userId);

    return NextResponse.json({
      userId,
      preferences: defaultPreferences,
      message: "Preferences reset to defaults",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error("DELETE /api/preferences - Failed to reset preferences", {
      error: error instanceof Error ? error.message : "Unknown error"
    });

    return NextResponse.json(
      { error: "Failed to reset preferences" },
      { status: 500 }
    );
  }
}
