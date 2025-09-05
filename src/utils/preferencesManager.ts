import { RoutingPreferences, DEFAULT_ROUTING_PREFERENCES, PRIORITY_WEIGHTS, RoutingPriority } from '@/config/routingPreferences';
import { Logger } from '@/utils/logger';

const logger = new Logger('PreferencesManager');

// In-memory storage for user preferences (in production, this would be a database)
const userPreferences = new Map<string, RoutingPreferences>();

class PreferencesManager {
  /**
   * Get user preferences, fallback to defaults if not set
   */
  getUserPreferences(userId: string = 'default'): RoutingPreferences {
    return userPreferences.get(userId) || { ...DEFAULT_ROUTING_PREFERENCES };
  }

  /**
   * Set user preferences
   */
  setUserPreferences(userId: string, preferences: Partial<RoutingPreferences>): RoutingPreferences {
    const currentPrefs = this.getUserPreferences(userId);
    const updatedPrefs = { ...currentPrefs, ...preferences };

    // Validate preferences
    this.validatePreferences(updatedPrefs);

    userPreferences.set(userId, updatedPrefs);

    logger.info('User preferences updated', {
      userId,
      priority: updatedPrefs.priority,
      allowedCategories: updatedPrefs.allowedCategories?.length || 0,
      excludedModels: updatedPrefs.excludedModels?.length || 0
    });

    return updatedPrefs;
  }

  /**
   * Reset user preferences to defaults
   */
  resetUserPreferences(userId: string): RoutingPreferences {
    userPreferences.delete(userId);
    logger.info('User preferences reset to defaults', { userId });
    return { ...DEFAULT_ROUTING_PREFERENCES };
  }

  /**
   * Validate routing preferences
   */
  private validatePreferences(preferences: RoutingPreferences): void {
    if (!Object.keys(PRIORITY_WEIGHTS).includes(preferences.priority)) {
      throw new Error(`Invalid priority: ${preferences.priority}. Must be one of: ${Object.keys(PRIORITY_WEIGHTS).join(', ')}`);
    }

    // Cost validation removed since all models are free




  }

  /**
   * Get all user preferences (for admin purposes)
   */
  getAllUserPreferences(): Record<string, RoutingPreferences> {
    const result: Record<string, RoutingPreferences> = {};
    for (const [userId, prefs] of userPreferences.entries()) {
      result[userId] = { ...prefs };
    }
    return result;
  }

  /**
   * Get preference statistics
   */
  getPreferenceStats() {
    const priorities: Record<RoutingPriority, number> = {
      auto: 0,
      cost: 0,
      latency: 0,
      quality: 0,
      balanced: 0
    };

    let totalUsers = 0;
    let usersWithCustomSettings = 0;

    for (const prefs of userPreferences.values()) {
      priorities[prefs.priority]++;
      totalUsers++;

      // Check if user has custom settings
      if (
        (prefs.allowedCategories && prefs.allowedCategories.length > 0) ||
        (prefs.excludedModels && prefs.excludedModels.length > 0)
      ) {
        usersWithCustomSettings++;
      }
    }

    return {
      totalUsers,
      usersWithCustomSettings,
      priorityDistribution: priorities,
      defaultUsers: totalUsers - usersWithCustomSettings
    };
  }
}

// Global preferences manager instance
export const preferencesManager = new PreferencesManager();

export default PreferencesManager;
