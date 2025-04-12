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
  MonthlyTotal
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
  const monthlyData: Record<string, { items: CardItem[], total: number, currency: string }> = {};
  
  Object.values(filteredItems).forEach(item => {
    const date = new Date(item.Date);
    const month = date.getMonth() + 1; // JavaScript months are 0-indexed
    const year = date.getFullYear();
    const key = `${year}-${String(month).padStart(2, '0')}`;
    
    if (!monthlyData[key]) {
      monthlyData[key] = {
        items: [],
        total: 0,
        currency: item.Currency // Assuming all items in a month have the same currency
      };
    }
    
    monthlyData[key].items.push(item);
    monthlyData[key].total += item.Amount;
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
      total: data.total,
      currency: data.currency,
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
      const { category, startDate, endDate, pendingTransactionOnly } = request.filter;
      
      if (category || startDate || endDate || pendingTransactionOnly) {
        filteredItems = Object.entries(cardItems).reduce((filtered, [id, item]) => {
          let include = true;
          
          if (category && item.Category !== category) {
            include = false;
          }
          
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
          
          if (pendingTransactionOnly && !item.PendingTransaction) {
            include = false;
          }
          
          if (include) {
            filtered[id] = item;
          }
          
          return filtered;
        }, {} as Record<string, CardItem>);
      }
    }
    
    // Group by month for pagination
    const groupedByMonth = groupByMonth(filteredItems);
    
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

// Process function that routes to the appropriate handler based on the API name
export const process = async (
  params: unknown,
  apiName?: string
): Promise<unknown> => {
  const fullApiName = apiName || name;
  
  switch (fullApiName) {
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
    default:
      // Default to getting all card items
      return getAllCardItems(params as GetCardItemsRequest);
  }
};
