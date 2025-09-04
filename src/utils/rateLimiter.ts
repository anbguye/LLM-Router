interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Rate limiting constants
const MAX_REQUESTS_PER_MINUTE = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute in milliseconds
// Note: RETRY_AFTER_SECONDS is defined for future use in HTTP headers
// const RETRY_AFTER_SECONDS = 60;

class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map();
  private readonly maxRequestsPerMinute = MAX_REQUESTS_PER_MINUTE;
  private readonly windowMs = RATE_LIMIT_WINDOW_MS;

  /**
   * Check if a request can be made
   * @returns true if request is allowed, false if rate limited
   */
  canMakeRequest(): boolean {
    const now = Date.now();
    const key = 'global'; // Global rate limit across all models

    const entry = this.requests.get(key);

    if (!entry || now > entry.resetTime) {
      // Reset window
      this.requests.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }

    if (entry.count >= this.maxRequestsPerMinute) {
      return false;
    }

    entry.count++;
    return true;
  }

  /**
   * Get time until rate limit resets (in milliseconds)
   */
  getTimeUntilReset(): number {
    const now = Date.now();
    const key = 'global';
    const entry = this.requests.get(key);

    if (!entry || now > entry.resetTime) {
      return 0;
    }

    return Math.max(0, entry.resetTime - now);
  }

  /**
   * Wait until rate limit resets
   */
  async waitForReset(): Promise<void> {
    const waitTime = this.getTimeUntilReset();
    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  /**
   * Get current request count in the window
   */
  getCurrentCount(): number {
    const key = 'global';
    const entry = this.requests.get(key);
    const now = Date.now();

    if (!entry || now > entry.resetTime) {
      return 0;
    }

    return entry.count;
  }

  /**
   * Get rate limit status
   */
  getStatus() {
    return {
      currentCount: this.getCurrentCount(),
      maxRequests: this.maxRequestsPerMinute,
      timeUntilReset: this.getTimeUntilReset(),
      isLimited: !this.canMakeRequest()
    };
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter();

export default RateLimiter;
