// src/types/transaction.ts
// Transaction-related type definitions

import type { PaginatedResponse } from './pagination';
import type { Token } from './token';

export interface Transaction {
  id: string;
  type: string;
  senderAddress: string;
  recipientAddress: string;
  /** legacy naming (EVM) */
  ethAmount: string;
  tokenAmount: string;
  tokenPrice: string;
  txHash: string;
  timestamp: string;
}

export interface TokenWithTransactions extends Token {
  transactions: {
    data: Transaction[];
    pagination: {
      currentPage: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
    };
  };
}

export interface PriceResponse {
  price: string;
}

export interface HistoricalPrice {
  tokenPrice: string;
  timestamp: string;
}

export interface USDHistoricalPrice {
  tokenPriceUSD: string;
  timestamp: string;
}

export interface TransactionResponse extends Omit<PaginatedResponse<Transaction>, 'data' | 'tokens'> {
  transactions: Transaction[];
}

export interface PriceCache {
  price: string;
  timestamp: number;
}
