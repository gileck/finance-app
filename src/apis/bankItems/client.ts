import {
  GetBankItemsRequest,
  GetBankItemsResponse,
  GetBankItemRequest,
  GetBankItemResponse,
  UpdateBankItemRequest,
  UpdateBankItemResponse,
  DeleteBankItemRequest,
  DeleteBankItemResponse,
  GetMonthlyBankTotalsRequest,
  GetMonthlyBankTotalsResponse
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

export const getBankItems = async (
  request: GetBankItemsRequest = {}
): Promise<CacheResult<GetBankItemsResponse>> => {
  return apiClient.call<CacheResult<GetBankItemsResponse>, GetBankItemsRequest>(
    getAllApiName,
    request,
    { disableCache: true }
  );
};

export const getBankItemById = async (
  request: GetBankItemRequest
): Promise<CacheResult<GetBankItemResponse>> => {
  return apiClient.call<CacheResult<GetBankItemResponse>, GetBankItemRequest>(
    getByIdApiName,
    request,
    { disableCache: true }
  );
};

export const updateBankItem = async (
  request: UpdateBankItemRequest
): Promise<CacheResult<UpdateBankItemResponse>> => {
  return apiClient.call<CacheResult<UpdateBankItemResponse>, UpdateBankItemRequest>(
    updateApiName,
    request,
    { disableCache: true }
  );
};

export const deleteBankItem = async (
  request: DeleteBankItemRequest
): Promise<CacheResult<DeleteBankItemResponse>> => {
  return apiClient.call<CacheResult<DeleteBankItemResponse>, DeleteBankItemRequest>(
    deleteApiName,
    request,
    { disableCache: true }
  );
};

export const getMonthlyBankTotals = async (
  request: GetMonthlyBankTotalsRequest = {}
): Promise<CacheResult<GetMonthlyBankTotalsResponse>> => {
  return apiClient.call<CacheResult<GetMonthlyBankTotalsResponse>, GetMonthlyBankTotalsRequest>(
    getMonthlyTotalsApiName,
    request,
    { disableCache: true }
  );
};
