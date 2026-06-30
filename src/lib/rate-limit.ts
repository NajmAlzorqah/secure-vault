/**
 * In-memory sliding window rate limiter.
 *
 * For a university project, this is sufficient.
 * In production, use Redis-based rate limiting (e.g., @upstash/ratelimit).
 *
 * Security purpose: prevents brute-force attacks on login and
 * excessive password reveal requests.
 */

interface RateLimitEntry {
	timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Clean up old entries periodically (every 5 minutes)
setInterval(
	() => {
		const now = Date.now();
		for (const [key, entry] of store.entries()) {
			entry.timestamps = entry.timestamps.filter((t) => now - t < 900_000);
			if (entry.timestamps.length === 0) {
				store.delete(key);
			}
		}
	},
	5 * 60 * 1000,
);

interface RateLimitOptions {
	/** Maximum number of requests allowed in the window */
	maxAttempts: number;
	/** Window duration in milliseconds */
	windowMs: number;
}

interface RateLimitResult {
	success: boolean;
	remaining: number;
	resetAt: Date;
}

/**
 * Checks if a request should be rate-limited.
 *
 * @param identifier - Unique key (e.g., IP address, user ID)
 * @param options - Rate limit configuration
 * @returns Object with success=true if allowed, false if rate-limited
 */
export function checkRateLimit(
	identifier: string,
	options: RateLimitOptions,
): RateLimitResult {
	const now = Date.now();
	const { maxAttempts, windowMs } = options;

	let entry = store.get(identifier);
	if (!entry) {
		entry = { timestamps: [] };
		store.set(identifier, entry);
	}

	// Remove timestamps outside the window
	entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

	if (entry.timestamps.length >= maxAttempts) {
		const oldestInWindow = entry.timestamps[0];
		return {
			success: false,
			remaining: 0,
			resetAt: new Date(oldestInWindow + windowMs),
		};
	}

	entry.timestamps.push(now);

	return {
		success: true,
		remaining: maxAttempts - entry.timestamps.length,
		resetAt: new Date(now + windowMs),
	};
}

// Pre-configured limiters for common use cases
export const LOGIN_RATE_LIMIT = {
	maxAttempts: 5,
	windowMs: 15 * 60 * 1000, // 15 minutes
} satisfies RateLimitOptions;

export const REVEAL_RATE_LIMIT = {
	maxAttempts: 20,
	windowMs: 60 * 1000, // 1 minute
} satisfies RateLimitOptions;
