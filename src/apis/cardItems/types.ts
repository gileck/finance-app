export interface CardItem {
  id: string;
  Date: string;
  Name: string;
  Amount: number;
  Category: string;
  Comments?: string;
  Currency: string;
  Card: boolean;
  DisplayName?: string;
  RawAmount?: number;
  PendingTransaction?: boolean;
}

export interface MonthlyTotal {
  month: string;
  year: number;
  total: number;
  currency: string;
  monthName: string;
}

export interface GetCardItemsRequest {
  // Optional filter parameters could be added here
  filter?: {
    category?: string;
    startDate?: string;
    endDate?: string;
    pendingTransactionOnly?: boolean;
  };
  // Pagination parameters
  pagination?: {
    limit?: number;  // Number of months to load
    offset?: number; // Number of months to skip
  };
}

export interface GetCardItemsResponse {
  cardItems: Record<string, CardItem>;
  hasMore: boolean;
  error?: string;
}

export interface GetMonthlyTotalsRequest {
  filter?: {
    category?: string;
    startDate?: string;
    endDate?: string;
  };
  // Pagination parameters
  pagination?: {
    limit?: number;  // Number of months to load
    offset?: number; // Number of months to skip
  };
}

export interface GetMonthlyTotalsResponse {
  monthlyTotals: MonthlyTotal[];
  hasMore: boolean;
  categories?: string[];
  error?: string;
}

export interface GetCardItemRequest {
  id: string;
}

export interface GetCardItemResponse {
  cardItem?: CardItem;
  error?: string;
}

export interface UpdateCardItemRequest {
  cardItem: CardItem;
}

export interface UpdateCardItemResponse {
  success: boolean;
  cardItem?: CardItem;
  error?: string;
}

export interface DeleteCardItemRequest {
  id: string;
}

export interface DeleteCardItemResponse {
  success: boolean;
  error?: string;
}
