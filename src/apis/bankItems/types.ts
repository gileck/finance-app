// Types for Bank Items

export interface BankItem {
  id: string;
  Date: string;
  Description: string;
  Amount: number;
  Balance: number;
  RawDate: string;
  type: string;
  Category: string;
  Bank: true;
}

export interface GetBankItemsRequest {
  filter?: {
    category?: string;
    startDate?: string;
    endDate?: string;
  };
  pagination?: {
    limit?: number;
    offset?: number;
  };
}

export interface GetBankItemsResponse {
  bankItems: Record<string, BankItem>;
  hasMore: boolean;
  error?: string;
}

export interface GetBankItemRequest {
  id: string;
}

export interface GetBankItemResponse {
  bankItem?: BankItem;
  error?: string;
}

export interface UpdateBankItemRequest {
  bankItem: BankItem;
}

export interface UpdateBankItemResponse {
  success: boolean;
  bankItem?: BankItem;
  error?: string;
}

export interface DeleteBankItemRequest {
  id: string;
}

export interface DeleteBankItemResponse {
  success: boolean;
  error?: string;
}

export interface MonthlyBankTotal {
  month: string;
  year: number;
  total: number;
  monthName: string;
}

export interface GetMonthlyBankTotalsRequest {
  filter?: {
    category?: string;
    startDate?: string;
    endDate?: string;
  };
  pagination?: {
    limit?: number;
    offset?: number;
  };
}

export interface GetMonthlyBankTotalsResponse {
  monthlyTotals: MonthlyBankTotal[];
  hasMore: boolean;
  categories?: string[];
  error?: string;
}
