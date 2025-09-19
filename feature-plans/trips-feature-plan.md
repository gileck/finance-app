## Trips Feature Plan

### 1. High-Level Solution

Introduce a new Trips domain to group and summarize credit card transactions across arbitrary date ranges. Users can create trips (name, location, date range), assign card transactions to a trip, and view a dedicated trip page with totals, currency-normalized summaries, category breakdowns, and the list of associated transactions. The flow: user creates a trip → assigns transactions (from Card Items views or from the Trip Details page) → views trip summary spanning multiple months.

### 2. Implementation Details

- The implementation follows the app’s API and client structure guidelines. New APIs will live under `src/apis/trips/` with `index.ts`, `types.ts`, `server.ts`, `client.ts`. On the client, add new routes under `src/client/routes/Trips/` for a list page and a details page. Card items gain an optional `tripId` field to associate them with a trip.

#### 2.1 Data Model

- Extend card items to optionally reference a trip:

```ts
// src/apis/cardItems/types.ts (edit)
export interface CardItem {
  // ...existing fields
  tripId?: string; // Trip association (ONLY for card items)
}
```

- New Trip type and storage in S3 `db.json` alongside `cardItems`:

```ts
// src/apis/trips/types.ts (new)
export interface Trip {
  id: string;           // uuid
  name: string;
  location?: string;
  startDate: string;    // ISO date (inclusive)
  endDate: string;      // ISO date (inclusive)
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetTripsRequest { filter?: { search?: string }; }
export interface GetTripsResponse { trips: Record<string, Trip>; error?: string; }
export interface GetTripByIdRequest { id: string; }
export interface GetTripByIdResponse { trip?: Trip; error?: string; }
export interface CreateTripRequest { trip: Omit<Trip, 'id'|'createdAt'|'updatedAt'>; }
export interface CreateTripResponse { success: boolean; trip?: Trip; error?: string; }
export interface UpdateTripRequest { trip: Trip; }
export interface UpdateTripResponse { success: boolean; trip?: Trip; error?: string; }
export interface DeleteTripRequest { id: string; }
export interface DeleteTripResponse { success: boolean; error?: string; }

// Link/unlink card items to trip in batches
export interface AssignCardItemsToTripRequest { tripId: string; cardItemIds: string[]; }
export interface AssignCardItemsToTripResponse { success: boolean; updatedCount: number; error?: string; }
export interface UnassignCardItemsFromTripRequest { cardItemIds: string[]; }
export interface UnassignCardItemsFromTripResponse { success: boolean; updatedCount: number; error?: string; }

// Aggregated trip summary
export interface GetTripSummaryRequest { id: string; }
export interface TripSummary {
  trip: Trip;
  totals: {
    totalNis: number;         // sum converted to NIS
    totalByCurrency: Record<string, number>;
  };
  categories: Array<{ category: string; totalNis: number; count: number }>;
  items: Record<string, import('../cardItems/types').CardItem>;
}
export interface GetTripSummaryResponse { summary?: TripSummary; error?: string; }
```

#### 2.2 New Trips API Module

- Create `src/apis/trips/index.ts` exporting API name and endpoint names (per guidelines: API names defined ONLY in `index.ts`).
- Create `src/apis/trips/server.ts` implementing business logic and S3 persistence within `db.json` (`db.trips`, default `{}`), reusing existing S3 helpers. The server should import endpoint names from `./index` and re-export `name` if needed.
- Create `src/apis/trips/client.ts` returning `CacheResult<T>` and importing endpoint names from `./index` (NEVER from `server.ts`).
- Register API endpoints in `src/apis/apis.ts` using constants imported from `./trips/index.ts`, while calling `tripsServer.process`.

Example `index.ts` and server process switch:

```ts
// src/apis/trips/index.ts (new)
export const name = 'trips';
export const getAllApiName = `${name}/getAll`;
export const getByIdApiName = `${name}/getById`;
export const createApiName = `${name}/create`;
export const updateApiName = `${name}/update`;
export const deleteApiName = `${name}/delete`;
export const assignCardItemsApiName = `${name}/assignCardItems`;
export const unassignCardItemsApiName = `${name}/unassignCardItems`;
export const getSummaryApiName = `${name}/getSummary`;
export * from './types';

// src/apis/trips/server.ts (new)
import { 
  name,
  getAllApiName, getByIdApiName, createApiName, updateApiName, deleteApiName,
  assignCardItemsApiName, unassignCardItemsApiName, getSummaryApiName
} from './index';

export const process = async (params: unknown, apiName?: string): Promise<unknown> => {
  switch (apiName) {
    case getAllApiName: return getAllTrips(params as GetTripsRequest);
    case getByIdApiName: return getTripById(params as GetTripByIdRequest);
    case createApiName: return createTrip(params as CreateTripRequest);
    case updateApiName: return updateTrip(params as UpdateTripRequest);
    case deleteApiName: return deleteTrip(params as DeleteTripRequest);
    case assignCardItemsApiName: return assignCardItemsToTrip(params as AssignCardItemsToTripRequest);
    case unassignCardItemsApiName: return unassignCardItemsFromTrip(params as UnassignCardItemsFromTripRequest);
    case getSummaryApiName: return getTripSummary(params as GetTripSummaryRequest);
    default: throw new Error(`Unknown API name: ${apiName}`);
  }
};
```

- Client calls:

```ts
// src/apis/trips/client.ts (new)
import type { CacheResult } from '@/server/cache/types';
import apiClient from '@/client/utils/apiClient';
import { 
  getAllApiName, getByIdApiName, createApiName, updateApiName, deleteApiName,
  assignCardItemsApiName, unassignCardItemsApiName, getSummaryApiName
} from './index';
import type { /* types from trips/types */ } from './types';

export const getTrips = async (req: GetTripsRequest = {}): Promise<CacheResult<GetTripsResponse>> =>
  apiClient.call(getAllApiName, req, { disableCache: true });
// ...similar for other calls (all return CacheResult<...>)
```

- `src/apis/apis.ts` registration (names imported from `trips/index.ts`, process imported from `trips/server.ts`).

```ts
// src/apis/apis.ts (edit)
import * as tripsServer from './trips/server';
import { 
  getAllApiName as tripsGetAll,
  getByIdApiName as tripsGetById,
  createApiName as tripsCreate,
  updateApiName as tripsUpdate,
  deleteApiName as tripsDelete,
  assignCardItemsApiName as tripsAssign,
  unassignCardItemsApiName as tripsUnassign,
  getSummaryApiName as tripsSummary
} from './trips';

export const apiHandlers: ApiHandlers = {
  // ...existing
  [tripsGetAll]: { process: (p: unknown) => tripsServer.process(p, tripsGetAll) as Promise<unknown> },
  [tripsGetById]: { process: (p: unknown) => tripsServer.process(p, tripsGetById) as Promise<unknown> },
  [tripsCreate]: { process: (p: unknown) => tripsServer.process(p, tripsCreate) as Promise<unknown> },
  [tripsUpdate]: { process: (p: unknown) => tripsServer.process(p, tripsUpdate) as Promise<unknown> },
  [tripsDelete]: { process: (p: unknown) => tripsServer.process(p, tripsDelete) as Promise<unknown> },
  [tripsAssign]: { process: (p: unknown) => tripsServer.process(p, tripsAssign) as Promise<unknown> },
  [tripsUnassign]: { process: (p: unknown) => tripsServer.process(p, tripsUnassign) as Promise<unknown> },
  [tripsSummary]: { process: (p: unknown) => tripsServer.process(p, tripsSummary) as Promise<unknown> },
};
```

#### 2.3 Card Items API updates

- Add optional filter by `tripId` for retrieval.

```ts
// src/apis/cardItems/types.ts (edit)
export interface GetCardItemsRequest {
  filter?: {
    // ...existing
    tripId?: string; // new
  };
  pagination?: { limit?: number; offset?: number };
}
```

```ts
// src/apis/cardItems/server.ts (edit)
// inside filtering reduce, after existing filters
if (request.filter?.tripId) {
  if (item.tripId !== request.filter.tripId) include = false;
}
```

#### 2.4 Client Routes and Components

- New routes:
  - `/trips`: Trips list and Create Trip dialog
  - `/trips/:id`: Trip details page (summary + transactions list)

Files to add:

```ts
// src/client/routes/Trips/index.ts
export { TripsList } from './TripsList';
export { TripDetails } from './TripDetails';

// src/client/routes/index.ts (edit)
import { TripsList, TripDetails } from './Trips';
// ...
'/trips': TripsList,
'/trips/:id': TripDetails,
```

- Components:
  - `TripsList.tsx`: fetch and display trips, create/edit/delete dialog.
  - `TripDetails.tsx`: shows summary totals, category breakdown, and transactions.
  - `TripEditDialog.tsx`: for create/edit trip.
  - `TripAssignDialog.tsx`: select card items by search/date range and assign to trip; or open from a card item to set `tripId`.

Reuse patterns from `src/client/components/shared/CardItemEditDialog.tsx` and routing patterns in `src/client/routes`.

Example details summary logic:

```ts
// src/client/routes/Trips/TripDetails.tsx (snippet)
const { routeParams } = useRouter();
const tripId = routeParams.id;
const { data: summary } = useTripsSummary(tripId); // wraps trips client getSummary

// Render totals (summary.totals.totalNis) and category list
// Render items list using existing list components or a simple table
```

#### 2.5 Hooks

- `useTrips.ts` for fetching trips and performing mutations (create, update, delete, assign/unassign, getSummary).
- `useTripAssignment.ts` for batch-assign from Card Items screens.

#### 2.6 UI Integration Points

- Card Items list and details dialogs: add an action “Assign to Trip” that opens `TripAssignDialog` and sets `tripId` via trips API assign endpoint (or directly by updating the card item via `updateCardItem` if assigning individually). Keep business logic of batch updates in the trips API to centralize S3 writes.

#### 2.7 Summary Calculations

- On the server in `trips/server.ts#getTripSummary`, query `cardItems` filtered by `tripId`, aggregate:
  - Convert each item to NIS using `convertToNis` from `src/common/currency.ts`.
  - Sum `totalNis` and per-currency totals.
  - Group by `Category` to produce category breakdown.

#### 2.8 Accessibility/UX

- Dialogs keyboard accessible; buttons labeled. Lists responsive. Loading and error states per routing guidelines. Persist last-used filters in settings if needed (optional).

### 3. Implementation Phases

- Phase 1: Data and APIs
  - Add `tripId` to `CardItem` type and card items filtering.
  - Implement `trips` API module (CRUD, assign/unassign, summary) and register in `apis.ts`.

- Phase 2: Client Routes and Base UI
  - Add `/trips` and `/trips/:id` routes.
  - Implement list, details, and edit dialogs.

- Phase 3: Assignment Workflows
  - Implement assignment dialog from trip details and from card items list.
  - Batch assign/unassign via trips API.

- Phase 4: Summary & Visualization
  - Implement totals and category breakdown on Trip Details.
  - Optional charts (reuse dashboard patterns if desired).

- Phase 5: Polish & Compliance
  - Error states, empty states, loading spinners.
  - Documentation and README updates.
  - Run `yarn checks` and fix lint/TS.

### Confirmed Decisions

- Single-trip membership: each card transaction may belong to at most one trip via `tripId`. Reassignment should atomically move the item to the new trip (previous `tripId` replaced).
- Trip deletion behavior: do not delete card items; unassign all associated items (`tripId = undefined`).
- Assignment outside date range: allowed. UI will default search filters to the trip date range and warn when assigning out-of-range items.
- Currency normalization: all trip summaries use NIS via `convertToNis`.
- Data migration: when `db.trips` is missing, default to an empty object `{}` without failing.

### 4. Potential Issues & Open Questions

- Decisions confirmed: single-trip membership; delete unassign; allow out-of-range assignments with UI default filters; NIS-based summaries; migration default to `{}`.
- Access control: follow existing app context; no special roles assumed.

### 5. Task List

- [ ] Task 1: Add `tripId` to `CardItem` type and card items filter
- [ ] Task 2: Scaffold `trips` API (types, index, server, client)
- [ ] Task 3: Register trips endpoints in `src/apis/apis.ts`
- [ ] Task 4: Implement CRUD handlers against S3 `db.json` (on delete, unassign all associated items)
- [ ] Task 5: Implement assign/unassign batch handlers
- [ ] Task 6: Implement `getTripSummary` with currency conversion and category breakdown
- [ ] Task 7: Create `/trips` route (TripsList) with create/edit/delete dialogs
- [ ] Task 8: Create `/trips/:id` route (TripDetails) with summary and items list
- [ ] Task 9: Add “Assign to Trip” action in Card Items flows (default filters to trip dates; warn on out-of-range)
- [ ] Task 10: Add hooks `useTrips` and `useTripAssignment`
- [ ] Task 11: Add loading/error/empty states per guidelines
- [ ] Task 12: Update documentation (README/feature notes)
- [ ] Task 13: Run yarn checks and resolve all issues

Instructions: Mark tasks as [✅] when completed during implementation and update this checklist as progress is made.

### Numbered Step-by-Step (Apply Order)

1) Types & Card Items API
   - Add `tripId?: string` to `CardItem` in `src/apis/cardItems/types.ts`.
   - Extend `GetCardItemsRequest.filter` with `tripId?: string`.
   - Apply server filter in `src/apis/cardItems/server.ts` reduce loop.

2) Trips API module
   - Create `src/apis/trips/{index.ts,types.ts,server.ts,client.ts}`.
   - Implement CRUD, assign/unassign, and summary in server. Ensure deletion unassigns all related card items.
   - Ensure client returns `CacheResult<ResponseType>` and imports names from `index.ts`.

3) API registration
   - Update `src/apis/apis.ts` to register all trips endpoint names using `trips/server.ts` exported names.

4) Client routes
   - Add `src/client/routes/Trips/{TripsList.tsx,TripDetails.tsx,TripEditDialog.tsx,TripAssignDialog.tsx,index.ts}`.
   - Register routes in `src/client/routes/index.ts`.

5) UI integration
   - Add “Assign to Trip” actions in Card Items list and dialogs; open `TripAssignDialog`.
   - Use trips API assign/unassign for batch operations. Default date filters to the trip range and show a warning when assigning out-of-range items.

6) Validation & checks
   - Verify app guidelines compliance (APIs, routes, components, TS standards).
   - Run `yarn checks` and fix all errors.

References:
- API structure and names: `src/apis/apis.ts` and app guidelines (client-server-communications).
- React components and routing: `src/client/components/*` and `src/client/routes/*`.
- Currency conversion: `src/common/currency.ts`.

