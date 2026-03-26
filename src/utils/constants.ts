// Shared constants across the application

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const TOKENS_PER_PAGE = 19;
export const MARQUEE_LIMIT = 40;
export const MAX_SEARCH_QUERY_LENGTH = 100;
export const MAX_SEARCH_LIMIT = 50;

// Token paths
export const TOKEN_BASE_PATH = '/token';

// WebSocket
export const WS_MAX_RECONNECT_DELAY = 30_000;
export const WS_INITIAL_RECONNECT_DELAY = 1_000;
export const WS_MAX_BUFFER_SIZE = 100;

// Token creation
export const SYMBOL_MIN_LENGTH = 2;
export const SYMBOL_MAX_LENGTH = 10;

// API
export const API_TIMEOUT_MS = 15_000;
export const UPLOAD_TIMEOUT_MS = 60_000;
export const API_MAX_RETRIES = 2;

// Trading
export const POLL_INTERVAL_MS = 1_000;
export const POLL_MAX_TRIES = 12;
export const DEFAULT_SLIPPAGE_BPS = 500;
export const MAX_SLIPPAGE_BPS = 10_000;

// File upload
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const COMPRESSED_TARGET_BYTES = 800 * 1024; // 800KB
export const MAX_IMAGE_DIMENSION = 1500;

// Reward
export const CLAIM_STATUS_TIMEOUT_MS = 20_000;
export const CLAIM_STATUS_POLL_MS = 1_500;

// Balance refresh
export const BALANCE_REFRESH_INTERVAL_MS = 15_000;

// Debounce
export const SWAP_DEBOUNCE_MS = 350;
