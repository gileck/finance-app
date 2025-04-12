/**
 * Server implementation for the AI usage monitoring API
 */

import { 
  getAllAIUsageRecords, 
  getAIUsageSummary 
} from '@/server/ai-usage-monitoring';
import { 
  GetAllAIUsageRequest, 
  GetAllAIUsageResponse, 
  GetAIUsageSummaryRequest, 
  GetAIUsageSummaryResponse 
} from './types';

// Export the API name
export const name = "monitoring/ai-usage";

/**
 * Process function for the AI usage monitoring API
 * Handles both "all" and "summary" endpoints
 */
export const process = async (
  params: GetAllAIUsageRequest | GetAIUsageSummaryRequest,
  endpoint: string
): Promise<GetAllAIUsageResponse | GetAIUsageSummaryResponse> => {
  // Determine which endpoint was called based on the endpoint parameter
  if (endpoint === 'all') {
    return getAllUsage(params as GetAllAIUsageRequest);
  } else if (endpoint === 'summary') {
    return getSummary(params as GetAIUsageSummaryRequest);
  } else {
    return {
      records: [],
      summary: {
        totalCost: 0,
        totalTokens: 0,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        usageByModel: {},
        usageByDay: {}
      },
      success: false,
      error: `Unknown endpoint: ${endpoint}`
    };
  }
};

/**
 * Get all AI usage records with summary
 */
const getAllUsage = async (
  params: GetAllAIUsageRequest
): Promise<GetAllAIUsageResponse> => {
  try {
    const records = await getAllAIUsageRecords({
      maxRecords: params.maxRecords
    });
    
    const summary = await getAIUsageSummary();
    
    return {
      records,
      summary,
      success: true
    };
  } catch (error) {
    console.error('Error getting AI usage records:', error);
    return {
      records: [],
      summary: {
        totalCost: 0,
        totalTokens: 0,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        usageByModel: {},
        usageByDay: {}
      },
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

/**
 * Get AI usage summary
 */
const getSummary = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  params: GetAIUsageSummaryRequest
): Promise<GetAIUsageSummaryResponse> => {
  try {
    const summary = await getAIUsageSummary();
    
    return {
      summary,
      success: true
    };
  } catch (error) {
    console.error('Error getting AI usage summary:', error);
    return {
      summary: {
        totalCost: 0,
        totalTokens: 0,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        usageByModel: {},
        usageByDay: {}
      },
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};
