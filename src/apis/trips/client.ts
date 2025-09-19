import type { CacheResult } from '@/server/cache/types';
import apiClient from '@/client/utils/apiClient';
import {
    getAllApiName,
    getByIdApiName,
    createApiName,
    updateApiName,
    deleteApiName,
    assignCardItemsApiName,
    unassignCardItemsApiName,
    getSummaryApiName,
} from './index';
import type {
    GetTripsRequest,
    GetTripsResponse,
    GetTripByIdRequest,
    GetTripByIdResponse,
    CreateTripRequest,
    CreateTripResponse,
    UpdateTripRequest,
    UpdateTripResponse,
    DeleteTripRequest,
    DeleteTripResponse,
    AssignCardItemsToTripRequest,
    AssignCardItemsToTripResponse,
    UnassignCardItemsFromTripRequest,
    UnassignCardItemsFromTripResponse,
    GetTripSummaryRequest,
    GetTripSummaryResponse,
} from './types';

export const getTrips = async (
    request: GetTripsRequest = {}
): Promise<CacheResult<GetTripsResponse>> =>
    apiClient.call(getAllApiName, request, { disableCache: true });

export const getTripById = async (
    request: GetTripByIdRequest
): Promise<CacheResult<GetTripByIdResponse>> =>
    apiClient.call(getByIdApiName, request, { disableCache: true });

export const createTrip = async (
    request: CreateTripRequest
): Promise<CacheResult<CreateTripResponse>> =>
    apiClient.call(createApiName, request, { disableCache: true });

export const updateTrip = async (
    request: UpdateTripRequest
): Promise<CacheResult<UpdateTripResponse>> =>
    apiClient.call(updateApiName, request, { disableCache: true });

export const deleteTrip = async (
    request: DeleteTripRequest
): Promise<CacheResult<DeleteTripResponse>> =>
    apiClient.call(deleteApiName, request, { disableCache: true });

export const assignCardItemsToTrip = async (
    request: AssignCardItemsToTripRequest
): Promise<CacheResult<AssignCardItemsToTripResponse>> =>
    apiClient.call(assignCardItemsApiName, request, { disableCache: true });

export const unassignCardItemsFromTrip = async (
    request: UnassignCardItemsFromTripRequest
): Promise<CacheResult<UnassignCardItemsFromTripResponse>> =>
    apiClient.call(unassignCardItemsApiName, request, { disableCache: true });

export const getTripSummary = async (
    request: GetTripSummaryRequest
): Promise<CacheResult<GetTripSummaryResponse>> =>
    apiClient.call(getSummaryApiName, request, { disableCache: true });


