// src/utils/api/index.ts
// Barrel re-export from all API domain modules

// Core infrastructure
export {
  AUTH_BASE_URL,
  authApi,
  getStoredToken,
  setStoredToken,
  setAuthToken,
  getAuthHeaders,
  newIdempotencyKey,
  type IdempotencyOptions,
} from './core';

// Token endpoints
export {
  getTokenInfo,
  getTokenPrice,
  getTokenLiquidity,
  getTokenTrades,
  getTokenHolders,
  getAllTokens,
  getAllTokensWithoutLiquidity,
  getTotalVolume,
  getVolumeRange,
  getTotalTokenCount,
  getRecentTokens,
  searchTokens,
  getTokensByCreator,
  getAllTokenAddresses,
  getTransactionsByAddress,
  updateToken,
  type TokenCategory,
  type TokenSearchFilters,
  type UpdateTokenRequest,
} from './tokens';

// Trading endpoints
export {
  buyToken,
  sellToken,
  previewBuy,
  previewSell,
  submitSignature,
  getTradingStatus,
} from './trading';

// Chat endpoints
export {
  getChatMessages,
  addChatMessage,
} from './chat';

// Points endpoints
export {
  getPointsOverview,
  getPointsView,
  getPointsHistory,
  type PointsOverviewResponse,
  type PointsViewResponse,
  type PointsHistoryResponse,
} from './points';

// Rewards endpoints
export {
  getRewardInfo,
  claimReward,
  convertRewardPoints,
  getRewardMarquee,
  getRewardSpinConfig,
  spinReward,
  type RewardSpinHistoryItem,
  type RewardInfoResponse,
  type RewardClaimRequest,
  type RewardClaimResponse,
  type RewardConvertRequest,
  type RewardConvertResponse,
  type RewardMarqueeItem,
  type RewardMarqueeResponse,
  type RewardSpinConfigResponse,
  type RewardSpinRequest,
  type RewardSpinResponse,
  type ConvertConfig,
} from './rewards';

// Token creation endpoints
export {
  prepareMint,
  confirmMint,
  uploadTokenImage,
  createTokenDraft,
  previewInitialBuy,
  finalizeTokenCreation,
  type PrepareMintRequest,
  type PrepareMintResponse,
  type ConfirmMintRequest,
  type ConfirmMintResponse,
  type UploadTokenImageRequest,
  type UploadTokenImageResponse,
  type CreateTokenDraftRequest,
  type CreateTokenDraftResponse,
  type PreviewInitialBuyRequest,
  type PreviewInitialBuyResponse,
  type FinalizeTokenRequest,
  type FinalizeTokenResponse,
} from './create';

// Leaderboard endpoints
export {
  getLeaderboardTop,
  getLeaderboardList,
  type LeaderboardTopItem,
  type LeaderboardListItem,
  type LeaderboardListResponse,
} from './leaderboard';
