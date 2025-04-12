import { 
  GetCardItemsRequest, 
  GetCardItemsResponse,
  GetCardItemRequest,
  GetCardItemResponse,
  UpdateCardItemRequest,
  UpdateCardItemResponse,
  DeleteCardItemRequest,
  DeleteCardItemResponse,
  GetMonthlyTotalsRequest,
  GetMonthlyTotalsResponse
} from "./types";
import type { CacheResult } from "@/server/cache/types";
import apiClient from "@/client/utils/apiClient";
import { 
  getAllApiName,
  getByIdApiName,
  updateApiName,
  deleteApiName,
  getMonthlyTotalsApiName
} from "./server";

// Client function to get all card items
export const getCardItems = async (
  request: GetCardItemsRequest = {}
): Promise<CacheResult<GetCardItemsResponse>> => {
  return apiClient.call<CacheResult<GetCardItemsResponse>, GetCardItemsRequest>(
    getAllApiName,
    request,
    {
      disableCache: true
    }
  );
};

// Client function to get monthly totals
export const getMonthlyTotals = async (
  request: GetMonthlyTotalsRequest = {}
): Promise<CacheResult<GetMonthlyTotalsResponse>> => {
  return apiClient.call<CacheResult<GetMonthlyTotalsResponse>, GetMonthlyTotalsRequest>(
    getMonthlyTotalsApiName,
    request,
    {
      disableCache: true
    }
  );
};

// Client function to get a card item by ID
export const getCardItemById = async (
  request: GetCardItemRequest
): Promise<CacheResult<GetCardItemResponse>> => {
  return apiClient.call<CacheResult<GetCardItemResponse>, GetCardItemRequest>(
    getByIdApiName,
    request,
    { disableCache: true }
  );
};

// Client function to update a card item
export const updateCardItem = async (
  request: UpdateCardItemRequest
): Promise<CacheResult<UpdateCardItemResponse>> => {
  return apiClient.call<CacheResult<UpdateCardItemResponse>, UpdateCardItemRequest>(
    updateApiName,
    request,
    { disableCache: true } // Disable cache for mutations
  );
};

// Client function to delete a card item
export const deleteCardItem = async (
  request: DeleteCardItemRequest
): Promise<CacheResult<DeleteCardItemResponse>> => {
  return apiClient.call<CacheResult<DeleteCardItemResponse>, DeleteCardItemRequest>(
    deleteApiName,
    request,
    { disableCache: true } // Disable cache for mutations
  );
};
