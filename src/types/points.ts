// src/types/points.ts
// Points-related type definitions

export type PointsOverviewResponse = {
  points: number;
  tickets: number;
};

export type PointsViewResponse = {
  rank: {
    current: string;
    next: string;
    currentVolume: number;
    nextRankVolume: number;
    remainingVolume: number;
    progressPercent: number;
  };
};

export type PointsHistoryItem = {
  type: string;
  points: number;
  timestamp: string;
};

export type PointsHistoryResponse = {
  items: PointsHistoryItem[];
};
