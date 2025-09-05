export type RoutingPriority = 'auto' | 'cost' | 'latency' | 'quality' | 'balanced';

export interface RoutingPreferences {
  priority: RoutingPriority;
  allowedCategories?: string[]; // Specific model categories to use
  excludedModels?: string[]; // Model IDs to exclude
}

export const DEFAULT_ROUTING_PREFERENCES: RoutingPreferences = {
  priority: 'auto',
  allowedCategories: [],
  excludedModels: []
};

// Priority weights for scoring models (all models are free, so cost is not a factor)
export const PRIORITY_WEIGHTS = {
  auto: { latency: 0.5, quality: 0.5 }, // Auto mode uses balanced weights
  latency: { latency: 0.8, quality: 0.2 },
  quality: { latency: 0.2, quality: 0.8 },
  balanced: { latency: 0.5, quality: 0.5 }
} as const;
