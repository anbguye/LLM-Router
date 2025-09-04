import { Logger } from '@/utils/logger';

const logger = new Logger('Analytics');

export interface RoutingAnalytics {
  totalRequests: number;
  modelUsage: Record<string, number>;
  categoryUsage: Record<string, number>;
  averageProcessingTime: number;
  totalTokensUsed: number;
  routingDecisions: RoutingDecisionLog[];
}

export interface RoutingDecisionLog {
  id: string;
  timestamp: number;
  userMessage: string;
  selectedModel: string;
  modelCategory: string;
  reasoning: string;
  confidence: number;
  processingTime: number;
  tokensUsed: number;
  estimatedCost: number;
  priority: string;
}

class AnalyticsTracker {
  private analytics: RoutingAnalytics = {
    totalRequests: 0,
    modelUsage: {},
    categoryUsage: {},
    averageProcessingTime: 0,
    totalTokensUsed: 0,
    routingDecisions: []
  };

  private readonly MAX_DECISIONS_LOGGED = 1000; // Keep last 1000 decisions

  /**
   * Log a routing decision for analytics
   */
  logRoutingDecision(
    userMessage: string,
    selectedModel: string,
    modelCategory: string,
    reasoning: string,
    confidence: number,
    processingTime: number,
    tokensUsed: number,
    estimatedCost: number,
    priority: string
  ): void {
    const decision: RoutingDecisionLog = {
      id: `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      userMessage: userMessage.substring(0, 200), // Truncate for storage
      selectedModel,
      modelCategory,
      reasoning,
      confidence,
      processingTime,
      tokensUsed,
      estimatedCost,
      priority
    };

    // Update analytics
    this.analytics.totalRequests++;
    this.analytics.modelUsage[selectedModel] = (this.analytics.modelUsage[selectedModel] || 0) + 1;
    this.analytics.categoryUsage[modelCategory] = (this.analytics.categoryUsage[modelCategory] || 0) + 1;
    this.analytics.totalTokensUsed += tokensUsed;

    // Update average processing time
    const currentAvg = this.analytics.averageProcessingTime;
    this.analytics.averageProcessingTime = (currentAvg * (this.analytics.totalRequests - 1) + processingTime) / this.analytics.totalRequests;

    // Cost calculations removed since all models are free

    // Add decision to log
    this.analytics.routingDecisions.unshift(decision);

    // Keep only recent decisions
    if (this.analytics.routingDecisions.length > this.MAX_DECISIONS_LOGGED) {
      this.analytics.routingDecisions = this.analytics.routingDecisions.slice(0, this.MAX_DECISIONS_LOGGED);
    }

    logger.debug('Routing decision logged', {
      model: selectedModel,
      category: modelCategory,
      processingTime,
      tokensUsed
    });
  }

  /**
   * Get current analytics data
   */
  getAnalytics(): RoutingAnalytics {
    return { ...this.analytics };
  }

  /**
   * Get analytics summary
   */
  getAnalyticsSummary() {
    const mostUsedModel = Object.entries(this.analytics.modelUsage)
      .sort(([,a], [,b]) => b - a)[0];

    const mostUsedCategory = Object.entries(this.analytics.categoryUsage)
      .sort(([,a], [,b]) => b - a)[0];

    return {
      totalRequests: this.analytics.totalRequests,
      mostUsedModel: mostUsedModel ? { model: mostUsedModel[0], count: mostUsedModel[1] } : null,
      mostUsedCategory: mostUsedCategory ? { category: mostUsedCategory[0], count: mostUsedCategory[1] } : null,
      averageProcessingTime: Math.round(this.analytics.averageProcessingTime),
      totalTokensUsed: this.analytics.totalTokensUsed,
      recentDecisions: this.analytics.routingDecisions.slice(0, 10)
    };
  }

  /**
   * Reset analytics data
   */
  resetAnalytics(): void {
    this.analytics = {
      totalRequests: 0,
      modelUsage: {},
      categoryUsage: {},
      averageProcessingTime: 0,
      totalTokensUsed: 0,
      routingDecisions: []
    };
    logger.info('Analytics data reset');
  }

  /**
   * Get model usage statistics
   */
  getModelUsageStats() {
    return {
      byModel: this.analytics.modelUsage,
      byCategory: this.analytics.categoryUsage,
      totalModelsUsed: Object.keys(this.analytics.modelUsage).length,
      totalCategoriesUsed: Object.keys(this.analytics.categoryUsage).length
    };
  }
}

// Global analytics instance
export const analytics = new AnalyticsTracker();

export default AnalyticsTracker;
