import { getFileAsString, uploadFile } from "@/server/s3/sdk";
import {
  BankItem,
  GetBankItemsRequest,
  GetBankItemsResponse,
  GetBankItemRequest,
  GetBankItemResponse,
  UpdateBankItemRequest,
  UpdateBankItemResponse,
  DeleteBankItemRequest,
  DeleteBankItemResponse,
  GetMonthlyBankTotalsRequest,
  GetMonthlyBankTotalsResponse,
  MonthlyBankTotal
} from "./types";

export const name = "bankItems";

export const getAllApiName = `${name}/getAll`;
export const getByIdApiName = `${name}/getById`;
export const updateApiName = `${name}/update`;
export const deleteApiName = `${name}/delete`;
export const getMonthlyTotalsApiName = `${name}/getMonthlyTotals`;

const DB_FILE_NAME = "db.json";

const getBankItemsFromS3 = async (): Promise<Record<string, BankItem>> => {
  try {
    const dbContent = await getFileAsString(DB_FILE_NAME);
    const db = JSON.parse(dbContent);
    // Only items with Bank: true
    return Object.fromEntries(
      Object.entries(db.bankItems || db.cardItems || {}).filter(([, item]) => item.Bank)
    );
  } catch (error) {
    throw new Error(`Failed to fetch bank items: ${error instanceof Error ? error.message : String(error)}`);
  }
};

const saveBankItemsToS3 = async (bankItems: Record<string, BankItem>): Promise<void> => {
  try {
    const dbContent = await getFileAsString(DB_FILE_NAME);
    const db = JSON.parse(dbContent);
    db.bankItems = bankItems;
    await uploadFile({
      content: JSON.stringify(db, null, 2),
      fileName: DB_FILE_NAME,
      contentType: "application/json"
    });
  } catch (error) {
    throw new Error(`Failed to save bank items: ${error instanceof Error ? error.message : String(error)}`);
  }
};

const groupByMonth = (items: Record<string, BankItem>): Record<string, BankItem[]> => {
  const grouped: Record<string, BankItem[]> = {};
  Object.values(items).forEach(item => {
    const date = new Date(item.Date);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!grouped[monthYear]) {
      grouped[monthYear] = [];
    }
    grouped[monthYear].push(item);
  });
  return grouped;
};

const calculateMonthlyTotals = (
  items: Record<string, BankItem>,
  filter?: { category?: string; startDate?: string; endDate?: string }
): MonthlyBankTotal[] => {
  let filteredItems = { ...items };
  if (filter?.category) {
    filteredItems = Object.entries(filteredItems).reduce((acc, [id, item]) => {
      if (item.Category === filter.category) acc[id] = item;
      return acc;
    }, {} as Record<string, BankItem>);
  }
  if (filter?.startDate || filter?.endDate) {
    filteredItems = Object.entries(filteredItems).reduce((acc, [id, item]) => {
      const itemDate = new Date(item.Date);
      const startDate = filter.startDate ? new Date(filter.startDate) : null;
      const endDate = filter.endDate ? new Date(filter.endDate) : null;
      if ((!startDate || itemDate >= startDate) && (!endDate || itemDate <= endDate)) {
        acc[id] = item;
      }
      return acc;
    }, {} as Record<string, BankItem>);
  }
  const grouped = groupByMonth(filteredItems);
  const monthlyTotals: MonthlyBankTotal[] = Object.entries(grouped).map(([monthYear, items]) => {
    const [yearStr, monthStr] = monthYear.split("-");
    const year = parseInt(yearStr);
    const month = monthStr;
    const total = items.reduce((sum, item) => sum + item.Amount, 0);
    const date = new Date(year, parseInt(monthStr) - 1, 1);
    const monthName = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
    return { month, year, total, monthName };
  });
  return monthlyTotals.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return parseInt(b.month) - parseInt(a.month);
  });
};

export const getAllBankItems = async (
  request: GetBankItemsRequest
): Promise<GetBankItemsResponse> => {
  try {
    const bankItems = await getBankItemsFromS3();
    let filteredItems = { ...bankItems };
    if (request.filter) {
      const { category, startDate, endDate } = request.filter;
      if (category || startDate || endDate) {
        filteredItems = Object.entries(bankItems).reduce((acc, [id, item]) => {
          let include = true;
          if (category && item.Category !== category) include = false;
          if (startDate && new Date(item.Date) < new Date(startDate)) include = false;
          if (endDate && new Date(item.Date) > new Date(endDate)) include = false;
          if (include) acc[id] = item;
          return acc;
        }, {} as Record<string, BankItem>);
      }
    }
    // Pagination
    const allIds = Object.keys(filteredItems);
    const limit = request.pagination?.limit || allIds.length;
    const offset = request.pagination?.offset || 0;
    const paginatedIds = allIds.slice(offset, offset + limit);
    const paginatedItems = paginatedIds.reduce((acc, id) => {
      acc[id] = filteredItems[id];
      return acc;
    }, {} as Record<string, BankItem>);
    const hasMore = offset + limit < allIds.length;
    return { bankItems: paginatedItems, hasMore };
  } catch (error) {
    return { bankItems: {}, hasMore: false, error: `Error: ${error instanceof Error ? error.message : String(error)}` };
  }
};

export const getBankItemById = async (
  request: GetBankItemRequest
): Promise<GetBankItemResponse> => {
  try {
    const bankItems = await getBankItemsFromS3();
    const bankItem = bankItems[request.id];
    if (!bankItem) {
      return { error: `Bank item with ID ${request.id} not found` };
    }
    return { bankItem };
  } catch (error) {
    return { error: `Error: ${error instanceof Error ? error.message : String(error)}` };
  }
};

export const updateBankItem = async (
  request: UpdateBankItemRequest
): Promise<UpdateBankItemResponse> => {
  try {
    const { bankItem } = request;
    if (!bankItem || !bankItem.id) {
      return { success: false, error: "Invalid bank item data: missing ID" };
    }
    const bankItems = await getBankItemsFromS3();
    bankItems[bankItem.id] = { ...bankItem };
    await saveBankItemsToS3(bankItems);
    return { success: true, bankItem: bankItems[bankItem.id] };
  } catch (error) {
    return { success: false, error: `Error: ${error instanceof Error ? error.message : String(error)}` };
  }
};

export const deleteBankItem = async (
  request: DeleteBankItemRequest
): Promise<DeleteBankItemResponse> => {
  try {
    const { id } = request;
    if (!id) {
      return { success: false, error: "Invalid request: missing ID" };
    }
    const bankItems = await getBankItemsFromS3();
    if (!bankItems[id]) {
      return { success: false, error: `Bank item with ID ${id} not found` };
    }
    delete bankItems[id];
    await saveBankItemsToS3(bankItems);
    return { success: true };
  } catch (error) {
    return { success: false, error: `Error: ${error instanceof Error ? error.message : String(error)}` };
  }
};

export const getMonthlyBankTotals = async (
  request: GetMonthlyBankTotalsRequest
): Promise<GetMonthlyBankTotalsResponse> => {
  try {
    const bankItems = await getBankItemsFromS3();
    const categories = Array.from(new Set(Object.values(bankItems).map(item => item.Category))).sort();
    const monthlyTotals = calculateMonthlyTotals(bankItems, request.filter);
    const limit = request.pagination?.limit || monthlyTotals.length;
    const offset = request.pagination?.offset || 0;
    const paginatedTotals = monthlyTotals.slice(offset, offset + limit);
    const hasMore = offset + limit < monthlyTotals.length;
    return { monthlyTotals: paginatedTotals, hasMore, categories };
  } catch (error) {
    return { monthlyTotals: [], hasMore: false, error: `Error: ${error instanceof Error ? error.message : String(error)}` };
  }
};

export const process = async (
  params: unknown,
  apiName?: string
): Promise<unknown> => {
  if (!apiName) throw new Error("API name is required");
  switch (apiName) {
    case getAllApiName:
      return getAllBankItems(params as GetBankItemsRequest);
    case getByIdApiName:
      return getBankItemById(params as GetBankItemRequest);
    case updateApiName:
      return updateBankItem(params as UpdateBankItemRequest);
    case deleteApiName:
      return deleteBankItem(params as DeleteBankItemRequest);
    case getMonthlyTotalsApiName:
      return getMonthlyBankTotals(params as GetMonthlyBankTotalsRequest);
    default:
      throw new Error(`Unknown API name: ${apiName}`);
  }
};
