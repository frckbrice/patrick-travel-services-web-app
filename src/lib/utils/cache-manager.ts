// PERFORMANCE: Native in-memory cache manager using Map()
// Zero dependencies, maximum performance for mobile PWA

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>>;
  private maxSize: number;

  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * Set cache entry with TTL (time to live)
   */
  set<T>(key: string, data: T, ttlMs: number = 60000): void {
    // PERFORMANCE: Limit cache size to prevent memory bloat on mobile
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry (FIFO)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttlMs,
    });
  }

  /**
   * Get cache entry if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    // PERFORMANCE: Auto-cleanup expired entries
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Check if cache has valid (non-expired) entry
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries matching pattern
   */
  invalidatePattern(pattern: RegExp): void {
    const keysToDelete: string[] = [];

    this.cache.forEach((_, key) => {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics (for debugging)
   */
  getStats() {
    const now = Date.now();
    let validCount = 0;
    let expiredCount = 0;

    this.cache.forEach((entry) => {
      if (now <= entry.expiresAt) {
        validCount++;
      } else {
        expiredCount++;
      }
    });

    return {
      total: this.cache.size,
      valid: validCount,
      expired: expiredCount,
      maxSize: this.maxSize,
    };
  }

  /**
   * Clean up expired entries (memory optimization)
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.cache.delete(key));
  }
}

// PERFORMANCE: Singleton instance for global cache
export const appCache = new CacheManager(150); // Max 150 entries for mobile

// PERFORMANCE: Auto-cleanup every 5 minutes to prevent memory bloat
if (typeof window !== 'undefined') {
  setInterval(
    () => {
      appCache.cleanup();
    },
    5 * 60 * 1000
  ); // 5 minutes
}

// Helper functions for common cache patterns
export const cacheHelpers = {
  /**
   * Generate cache key for user-specific data
   */
  userKey: (userId: string, resource: string) => `user:${userId}:${resource}`,

  /**
   * Generate cache key for list resources
   */
  listKey: (resource: string, filters?: Record<string, any>) => {
    const filterStr = filters ? `:${JSON.stringify(filters)}` : '';
    return `list:${resource}${filterStr}`;
  },

  /**
   * Generate cache key for single resource
   */
  itemKey: (resource: string, id: string) => `item:${resource}:${id}`,
};
