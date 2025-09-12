import { getFileAsString, uploadFile } from "@/server/s3/sdk";
import {
  CardItem,
  GetCardItemsRequest,
  GetCardItemsResponse,
  GetCardItemRequest,
  GetCardItemResponse,
  UpdateCardItemRequest,
  UpdateCardItemResponse,
  DeleteCardItemRequest,
  DeleteCardItemResponse,
  GetMonthlyTotalsRequest,
  GetMonthlyTotalsResponse,
  MonthlyTotal,
  GetLastUpdateResponse
} from "./types";
import { name } from './index';

// Export the API name
export { name };

// Define API endpoint names
export const getAllApiName = `${name}/getAll`;
export const getByIdApiName = `${name}/getById`;
export const updateApiName = `${name}/update`;
export const deleteApiName = `${name}/delete`;
export const getMonthlyTotalsApiName = `${name}/getMonthlyTotals`;
export const getLastUpdateApiName = `${name}/getLastUpdate`;

// DB file name in S3
const DB_FILE_NAME = "db.json";

// Helper function to get all card items from S3
const getCardItemsFromS3 = async (): Promise<Record<string, CardItem>> => {
  try {
    const dbContent = await getFileAsString(DB_FILE_NAME);
    const db = JSON.parse(dbContent);
    return db.cardItems || {};
  } catch (error) {
    console.error("Error fetching card items from S3:", error);
    throw new Error(`Failed to fetch card items: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Helper function to save card items to S3
const saveCardItemsToS3 = async (cardItems: Record<string, CardItem>): Promise<void> => {
  try {
    const dbContent = await getFileAsString(DB_FILE_NAME);
    const db = JSON.parse(dbContent);

    // Update only the cardItems property
    db.cardItems = cardItems;

    await uploadFile({
      content: JSON.stringify(db, null, 2),
      fileName: DB_FILE_NAME,
      contentType: "application/json"
    });
  } catch (error) {
    console.error("Error saving card items to S3:", error);
    throw new Error(`Failed to save card items: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Helper function to group card items by month
const groupByMonth = (items: Record<string, CardItem>): Record<string, CardItem[]> => {
  const grouped: Record<string, CardItem[]> = {};

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

// Helper function to calculate monthly totals
const calculateMonthlyTotals = (
  items: Record<string, CardItem>,
  filter?: { category?: string }
): MonthlyTotal[] => {
  // Filter items if category is provided
  let filteredItems = { ...items };
  if (filter?.category) {
    filteredItems = Object.entries(items).reduce((filtered, [id, item]) => {
      if (item.Category === filter.category) {
        filtered[id] = item;
      }
      return filtered;
    }, {} as Record<string, CardItem>);
  }

  // Group items by month and year
  const monthlyData: Record<string, { items: CardItem[], totalNis: number }> = {};

  Object.values(filteredItems).forEach(item => {
    const date = new Date(item.Date);
    const month = date.getMonth() + 1; // JavaScript months are 0-indexed
    const year = date.getFullYear();
    const key = `${year}-${String(month).padStart(2, '0')}`;

    if (!monthlyData[key]) {
      monthlyData[key] = {
        items: [],
        totalNis: 0
      };
    }

    monthlyData[key].items.push(item);
    // Convert to NIS before aggregating
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { convertToNis } = require('@/common/currency');
    monthlyData[key].totalNis += convertToNis(item.Amount, item.Currency);
  });

  // Convert to array of MonthlyTotal objects
  const monthlyTotals: MonthlyTotal[] = Object.entries(monthlyData).map(([key, data]) => {
    const [yearStr, monthStr] = key.split('-');
    const year = parseInt(yearStr);
    const month = monthStr;

    // Get month name
    const date = new Date(year, parseInt(monthStr) - 1, 1);
    const monthName = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);

    return {
      month,
      year,
      total: data.totalNis,
      currency: 'NIS',
      monthName
    };
  });

  // Sort by year and month (descending)
  return monthlyTotals.sort((a, b) => {
    if (a.year !== b.year) {
      return b.year - a.year;
    }
    return b.month.localeCompare(a.month);
  });
};

// Get all card items with pagination
export const getAllCardItems = async (
  request: GetCardItemsRequest
): Promise<GetCardItemsResponse> => {
  try {
    const cardItems = await getCardItemsFromS3();

    // Apply filters if provided
    let filteredItems = { ...cardItems };

    if (request.filter) {
      const {
        category,
        categories,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        searchTerm,
        pendingTransactionOnly,
        hasVersion,
        specificVersion
      } = request.filter;

      if (category || (categories && categories.length > 0) || startDate || endDate || minAmount !== undefined || maxAmount !== undefined || searchTerm || pendingTransactionOnly || hasVersion !== undefined || specificVersion) {
        filteredItems = Object.entries(cardItems).reduce((filtered, [id, item]) => {
          let include = true;

          // Category filtering (single category)
          if (category && item.Category !== category) {
            include = false;
          }

          // Categories filtering (multiple categories)
          if (categories && categories.length > 0 && !categories.includes(item.Category)) {
            include = false;
          }

          // Date range filtering
          if (startDate) {
            const itemDate = new Date(item.Date);
            const filterStartDate = new Date(startDate);
            if (itemDate < filterStartDate) {
              include = false;
            }
          }

          if (endDate) {
            const itemDate = new Date(item.Date);
            const filterEndDate = new Date(endDate);
            if (itemDate > filterEndDate) {
              include = false;
            }
          }

          // Amount range filtering
          if (minAmount !== undefined && item.Amount < minAmount) {
            include = false;
          }

          if (maxAmount !== undefined && item.Amount > maxAmount) {
            include = false;
          }

          // Search term filtering (search in Name, DisplayName, and Comments)
          if (searchTerm && searchTerm.trim() !== '') {
            const searchLower = searchTerm.toLowerCase();
            const nameMatch = item.Name.toLowerCase().includes(searchLower);
            const displayNameMatch = item.DisplayName && item.DisplayName.toLowerCase().includes(searchLower);
            const commentsMatch = item.Comments && item.Comments.some(comment =>
              comment.toLowerCase().includes(searchLower)
            );

            if (!nameMatch && !displayNameMatch && !commentsMatch) {
              include = false;
            }
          }

          // Pending transaction filtering
          if (pendingTransactionOnly && !item.PendingTransaction) {
            include = false;
          }

          // Version filtering
          if (hasVersion !== undefined) {
            const itemHasVersion = item.version !== undefined && item.version !== null && item.version !== '';
            if (hasVersion && !itemHasVersion) {
              include = false;
            } else if (!hasVersion && itemHasVersion) {
              include = false;
            }
          }

          if (specificVersion && specificVersion.trim() !== '') {
            if (!item.version || item.version.toString() !== specificVersion) {
              include = false;
            }
          }

          if (include) {
            filtered[id] = item;
          }

          return filtered;
        }, {} as Record<string, CardItem>);
      }
    }

    // Apply sorting if provided
    let sortedItems = filteredItems;
    if (request.filter?.sortBy && request.filter?.sortDirection) {
      const { sortBy, sortDirection } = request.filter;
      const itemsArray = Object.values(filteredItems);

      itemsArray.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortBy) {
          case 'date':
            aValue = new Date(a.Date);
            bValue = new Date(b.Date);
            break;
          case 'amount':
            aValue = a.Amount;
            bValue = b.Amount;
            break;
          case 'category':
            aValue = a.Category.toLowerCase();
            bValue = b.Category.toLowerCase();
            break;
          case 'name':
            aValue = (a.DisplayName || a.Name).toLowerCase();
            bValue = (b.DisplayName || b.Name).toLowerCase();
            break;
          default:
            aValue = new Date(a.Date);
            bValue = new Date(b.Date);
        }

        if (aValue < bValue) {
          return sortDirection === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
      });

      // Convert back to object with IDs as keys
      sortedItems = itemsArray.reduce((result, item) => {
        result[item.id] = item;
        return result;
      }, {} as Record<string, CardItem>);
    }

    // Group by month for pagination
    const groupedByMonth = groupByMonth(sortedItems);

    // Sort months in descending order (newest first)
    const sortedMonths = Object.keys(groupedByMonth).sort((a, b) => b.localeCompare(a));

    // Apply pagination if provided
    const limit = request.pagination?.limit || sortedMonths.length;
    const offset = request.pagination?.offset || 0;

    const paginatedMonths = sortedMonths.slice(offset, offset + limit);
    const hasMore = offset + limit < sortedMonths.length;

    // Create a new object with only the items from the paginated months
    const paginatedItems = paginatedMonths.reduce((result, month) => {
      const monthItems = groupedByMonth[month];
      monthItems.forEach(item => {
        result[item.id] = item;
      });
      return result;
    }, {} as Record<string, CardItem>);

    return {
      cardItems: paginatedItems,
      hasMore
    };
  } catch (error) {
    return {
      cardItems: {},
      hasMore: false,
      error: `Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

// Get a single card item by ID
export const getCardItemById = async (
  request: GetCardItemRequest
): Promise<GetCardItemResponse> => {
  try {
    const cardItems = await getCardItemsFromS3();
    const cardItem = cardItems[request.id];

    if (!cardItem) {
      return {
        error: `Card item with ID ${request.id} not found`
      };
    }

    return {
      cardItem
    };
  } catch (error) {
    return {
      error: `Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

// Update a card item
export const updateCardItem = async (
  request: UpdateCardItemRequest
): Promise<UpdateCardItemResponse> => {
  try {
    const { cardItem } = request;

    if (!cardItem || !cardItem.id) {
      return {
        success: false,
        error: "Invalid card item data: missing ID"
      };
    }

    const cardItems = await getCardItemsFromS3();

    // Update the card item
    cardItems[cardItem.id] = {
      ...cardItem
    };

    await saveCardItemsToS3(cardItems);

    return {
      success: true,
      cardItem: cardItems[cardItem.id]
    };
  } catch (error) {
    return {
      success: false,
      error: `Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

// Delete a card item
export const deleteCardItem = async (
  request: DeleteCardItemRequest
): Promise<DeleteCardItemResponse> => {
  try {
    const { id } = request;

    if (!id) {
      return {
        success: false,
        error: "Invalid request: missing ID"
      };
    }

    const cardItems = await getCardItemsFromS3();

    // Check if the card item exists
    if (!cardItems[id]) {
      return {
        success: false,
        error: `Card item with ID ${id} not found`
      };
    }

    // Delete the card item
    delete cardItems[id];

    await saveCardItemsToS3(cardItems);

    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: `Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

// Get monthly totals
export const getMonthlyTotals = async (
  request: GetMonthlyTotalsRequest
): Promise<GetMonthlyTotalsResponse> => {
  try {
    const cardItems = await getCardItemsFromS3();

    // Get all unique categories
    const categories = Array.from(
      new Set(Object.values(cardItems).map(item => item.Category))
    ).sort();

    // Calculate monthly totals
    const monthlyTotals = calculateMonthlyTotals(cardItems, request.filter);

    // Apply pagination if provided
    const limit = request.pagination?.limit || monthlyTotals.length;
    const offset = request.pagination?.offset || 0;

    const paginatedTotals = monthlyTotals.slice(offset, offset + limit);
    const hasMore = offset + limit < monthlyTotals.length;

    return {
      monthlyTotals: paginatedTotals,
      hasMore,
      categories
    };
  } catch (error) {
    return {
      monthlyTotals: [],
      hasMore: false,
      error: `Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

// Get last update timestamp
export const getLastUpdate = async (
): Promise<GetLastUpdateResponse> => {
  try {
    const dbContent = await getFileAsString(DB_FILE_NAME);
    const db = JSON.parse(dbContent);

    return {
      lastUpdate: db.lastUpdate || null
    };
  } catch (error) {
    console.error("Error fetching last update time:", error);
    return {
      error: `Failed to fetch last update time: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

// Process function that routes to the appropriate handler based on the API name
export const process = async (
  params: unknown,
  apiName?: string
): Promise<unknown> => {
  if (!apiName) {
    throw new Error("API name is required");
  }

  switch (apiName) {
    case getAllApiName:
      return getAllCardItems(params as GetCardItemsRequest);
    case getByIdApiName:
      return getCardItemById(params as GetCardItemRequest);
    case updateApiName:
      return updateCardItem(params as UpdateCardItemRequest);
    case deleteApiName:
      return deleteCardItem(params as DeleteCardItemRequest);
    case getMonthlyTotalsApiName:
      return getMonthlyTotals(params as GetMonthlyTotalsRequest);
    case getLastUpdateApiName:
      return getLastUpdate();
    default:
      throw new Error(`Unknown API name: ${apiName}`);
  }
};
