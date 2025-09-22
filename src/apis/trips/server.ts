import { getFileAsString, uploadFile } from '@/server/s3/sdk';
import { CardItem } from '../cardItems/types';
import {
    Trip,
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
    TripSummary,
} from './types';
import {
    name,
    getAllApiName,
    getByIdApiName,
    createApiName,
    updateApiName,
    deleteApiName,
    assignCardItemsApiName,
    unassignCardItemsApiName,
    getSummaryApiName,
} from './index';

export { name };

const DB_FILE_NAME = 'db.json';

const readDb = async (): Promise<{ trips: Record<string, Trip>; cardItems: Record<string, CardItem>; lastUpdate?: string }> => {
    const content = await getFileAsString(DB_FILE_NAME);
    const db = JSON.parse(content);
    return {
        trips: db.trips || {},
        cardItems: db.cardItems || {},
        lastUpdate: db.lastUpdate,
    };
};

const writeDb = async (update: Partial<{ trips: Record<string, Trip>; cardItems: Record<string, CardItem>; lastUpdate?: string }>) => {
    const content = await getFileAsString(DB_FILE_NAME);
    const db = JSON.parse(content);
    const merged = { ...db, ...update };
    await uploadFile({ content: JSON.stringify(merged, null, 2), fileName: DB_FILE_NAME, contentType: 'application/json' });
};

const generateId = (): string => {
    return 'trip_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
};

export const getAllTrips = async (request: GetTripsRequest): Promise<GetTripsResponse> => {
    try {
        const { trips } = await readDb();
        // Backfill missing ids inside trip objects using their map keys (data fix for older entries)
        let changed = false;
        const fixedTrips: Record<string, Trip> = { ...trips };
        Object.entries(trips).forEach(([key, t]) => {
            if (!t.id || t.id.trim() === '') {
                fixedTrips[key] = { ...t, id: key };
                changed = true;
            }
        });
        if (changed) {
            await writeDb({ trips: fixedTrips });
        }
        const source = changed ? fixedTrips : trips;
        const search = request.filter?.search?.toLowerCase();
        if (!search) return { trips: source };
        const filtered = Object.entries(source).reduce((acc, [id, t]) => {
            const hay = `${t.name} ${t.location || ''}`.toLowerCase();
            if (hay.includes(search)) acc[id] = t;
            return acc;
        }, {} as Record<string, Trip>);
        return { trips: filtered };
    } catch (e) {
        return { trips: {}, error: `Error: ${e instanceof Error ? e.message : String(e)}` };
    }
};

export const getTripById = async (request: GetTripByIdRequest): Promise<GetTripByIdResponse> => {
    try {
        const { trips } = await readDb();
        const trip = trips[request.id];
        if (!trip) return { error: `Trip ${request.id} not found` };
        return { trip };
    } catch (e) {
        return { error: `Error: ${e instanceof Error ? e.message : String(e)}` };
    }
};

export const createTrip = async (request: CreateTripRequest): Promise<CreateTripResponse> => {
    try {
        const { trips } = await readDb();
        const id = generateId();
        const now = new Date().toISOString();
        const newTrip: Trip = { ...request.trip, id, createdAt: now, updatedAt: now };
        await writeDb({ trips: { ...trips, [id]: newTrip } });
        return { success: true, trip: newTrip };
    } catch (e) {
        return { success: false, error: `Error: ${e instanceof Error ? e.message : String(e)}` };
    }
};

export const updateTrip = async (request: UpdateTripRequest): Promise<UpdateTripResponse> => {
    try {
        const { trips } = await readDb();
        const existing = trips[request.trip.id];
        if (!existing) return { success: false, error: `Trip ${request.trip.id} not found` };
        const updated: Trip = { ...existing, ...request.trip, updatedAt: new Date().toISOString() };
        await writeDb({ trips: { ...trips, [updated.id]: updated } });
        return { success: true, trip: updated };
    } catch (e) {
        return { success: false, error: `Error: ${e instanceof Error ? e.message : String(e)}` };
    }
};

export const deleteTrip = async (request: DeleteTripRequest): Promise<DeleteTripResponse> => {
    try {
        const { trips, cardItems } = await readDb();
        if (!trips[request.id]) return { success: false, error: `Trip ${request.id} not found` };
        // Unassign all associated card items
        const updatedItems: Record<string, CardItem> = {};
        Object.values(cardItems).forEach((item) => {
            if (item.tripId === request.id) {
                const cleared = { ...item } as CardItem & { tripId?: string };
                delete (cleared as { tripId?: string }).tripId;
                updatedItems[item.id] = cleared as CardItem;
            } else {
                updatedItems[item.id] = item;
            }
        });
        const remainingTrips: Record<string, Trip> = { ...trips };
        delete remainingTrips[request.id];
        await writeDb({ trips: remainingTrips, cardItems: updatedItems });
        return { success: true };
    } catch (e) {
        return { success: false, error: `Error: ${e instanceof Error ? e.message : String(e)}` };
    }
};

export const assignCardItemsToTrip = async (
    request: AssignCardItemsToTripRequest
): Promise<AssignCardItemsToTripResponse> => {
    try {
        const { trips, cardItems } = await readDb();
        if (!trips[request.tripId]) return { success: false, updatedCount: 0, error: `Trip ${request.tripId} not found` };
        let updatedCount = 0;
        const updated: Record<string, CardItem> = { ...cardItems };
        request.cardItemIds.forEach((id) => {
            const item = updated[id];
            if (item) {
                updated[id] = { ...item, tripId: request.tripId };
                updatedCount += 1;
            }
        });
        await writeDb({ cardItems: updated });
        return { success: true, updatedCount };
    } catch (e) {
        return { success: false, updatedCount: 0, error: `Error: ${e instanceof Error ? e.message : String(e)}` };
    }
};

export const unassignCardItemsFromTrip = async (
    request: UnassignCardItemsFromTripRequest
): Promise<UnassignCardItemsFromTripResponse> => {
    try {
        const { cardItems } = await readDb();
        let updatedCount = 0;
        const updated: Record<string, CardItem> = { ...cardItems };
        request.cardItemIds.forEach((id) => {
            const item = updated[id];
            if (item && item.tripId) {
                const cleared = { ...item } as CardItem & { tripId?: string };
                delete (cleared as { tripId?: string }).tripId;
                updated[id] = cleared as CardItem;
                updatedCount += 1;
            }
        });
        await writeDb({ cardItems: updated });
        return { success: true, updatedCount };
    } catch (e) {
        return { success: false, updatedCount: 0, error: `Error: ${e instanceof Error ? e.message : String(e)}` };
    }
};

export const getTripSummary = async (request: GetTripSummaryRequest): Promise<GetTripSummaryResponse> => {
    try {
        const { trips, cardItems } = await readDb();
        const trip = trips[request.id];
        if (!trip) return { error: `Trip ${request.id} not found` };
        const items = Object.values(cardItems).filter((i) => i.tripId === request.id);
        const rateMap: Record<string, number> = { NIS: 1, ILS: 1, '₪': 1, USD: 3.32, EUR: 3.6, GBP: 4.2, IDR: 0.00020 };
        const totalsByCurrency: Record<string, number> = {};
        let totalNis = 0;
        const categoriesAccumulator: Record<string, { totalNis: number; count: number }> = {};
        items.forEach((i) => {
            const cur = (i.Currency || 'NIS').toUpperCase();
            const rate = rateMap[cur] ?? 1;
            const nis = i.Amount * rate;
            totalNis += nis;
            totalsByCurrency[i.Currency] = (totalsByCurrency[i.Currency] || 0) + i.Amount;
            const bucket = categoriesAccumulator[i.Category] || { totalNis: 0, count: 0 };
            bucket.totalNis += nis;
            bucket.count += 1;
            categoriesAccumulator[i.Category] = bucket;
        });

        const categories = Object.entries(categoriesAccumulator)
            .map(([category, val]) => ({ category, totalNis: val.totalNis, count: val.count }))
            .sort((a, b) => b.totalNis - a.totalNis);

        const itemsMap = items.reduce((acc, i) => { acc[i.id] = i; return acc; }, {} as Record<string, CardItem>);

        const summary: TripSummary = {
            trip,
            totals: { totalNis, totalByCurrency: totalsByCurrency },
            categories,
            items: itemsMap,
        };
        return { summary };
    } catch (e) {
        return { error: `Error: ${e instanceof Error ? e.message : String(e)}` };
    }
};

export const process = async (params: unknown, apiName?: string): Promise<unknown> => {
    if (!apiName) throw new Error('API name is required');
    switch (apiName) {
        case getAllApiName: return getAllTrips(params as GetTripsRequest);
        case getByIdApiName: return getTripById(params as GetTripByIdRequest);
        case createApiName: return createTrip(params as CreateTripRequest);
        case updateApiName: return updateTrip(params as UpdateTripRequest);
        case deleteApiName: return deleteTrip(params as DeleteTripRequest);
        case assignCardItemsApiName: return assignCardItemsToTrip(params as AssignCardItemsToTripRequest);
        case unassignCardItemsApiName: return unassignCardItemsFromTrip(params as UnassignCardItemsFromTripRequest);
        case getSummaryApiName: return getTripSummary(params as GetTripSummaryRequest);
        default:
            throw new Error(`Unknown API name: ${apiName}`);
    }
};


