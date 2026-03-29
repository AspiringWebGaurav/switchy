export const APP_NAME = "Switchyy";

export const SESSION_COOKIE_NAME = "__session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 5; // 5 days in seconds

export const RATE_LIMIT_MAX = 60;
export const RATE_LIMIT_WINDOW = 60; // seconds

export const CACHE_TTL = 30; // seconds — decision response cache
export const EVENT_STORE_TTL = 300; // seconds — SSE replay event store (longer window for reconnects)
export const BLOCKED_CACHE_TTL = 5; // seconds — brief cache for paused projects to reduce Firestore reads

export const PUBLIC_KEY_PREFIX = "pk_";
export const PUBLIC_KEY_BYTES = 12; // generates 24 hex chars
