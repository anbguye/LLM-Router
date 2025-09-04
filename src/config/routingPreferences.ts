export type RoutingPriority = 'cost' | 'latency' | 'quality' | 'balanced';

export interface RoutingPreferences {
  priority: RoutingPriority;
  maxLatency?: number; // Maximum acceptable latency in ms (for latency priority)
  minQuality?: number; // Minimum quality threshold (for quality priority)
  allowedCategories?: string[]; // Specific model categories to use
  excludedModels?: string[]; // Model IDs to exclude
}

export const DEFAULT_ROUTING_PREFERENCES: RoutingPreferences = {
  priority: 'balanced',
  maxLatency: 5000, // 5 seconds
  minQuality: 0.7, // 70% quality threshold
  allowedCategories: [],
  excludedModels: []
};

// Priority weights for scoring models (all models are free, so cost is not a factor)
export const PRIORITY_WEIGHTS = {
  latency: { latency: 0.8, quality: 0.2 },
  quality: { latency: 0.2, quality: 0.8 },
  balanced: { latency: 0.5, quality: 0.5 }
} as const;
