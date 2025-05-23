import { ApiHandlers } from "./types";
import * as chat from "./chat/server";
import * as clearCache from "./settings/clearCache/server";
import * as fileManagement from "./fileManagement/server";
import * as aiUsage from "./monitoring/aiUsage/server";
import * as cardItems from "./cardItems/server";
import * as bankItems from "./bankItems/server";
import { GetAllAIUsageRequest, GetAIUsageSummaryRequest } from "./monitoring/aiUsage/types";


export const apiHandlers: ApiHandlers = {
  [chat.name]: { process: chat.process as (params: unknown) => Promise<unknown>},
  [clearCache.name]: { process: clearCache.process as (params: unknown) => Promise<unknown>},
  [fileManagement.name]: { process: fileManagement.process as (params: unknown) => Promise<unknown>},
  [`${aiUsage.name}/all`]: { 
    process: (params: unknown) => aiUsage.process(
      params as GetAllAIUsageRequest, 
      'all'
    ) as Promise<unknown>
  },
  [`${aiUsage.name}/summary`]: { 
    process: (params: unknown) => aiUsage.process(
      params as GetAIUsageSummaryRequest, 
      'summary'
    ) as Promise<unknown>
  },
  [cardItems.getAllApiName]: { 
    process: (params: unknown) => cardItems.process(
      params, 
      cardItems.getAllApiName
    ) as Promise<unknown>
  },
  [cardItems.getByIdApiName]: { 
    process: (params: unknown) => cardItems.process(
      params, 
      cardItems.getByIdApiName
    ) as Promise<unknown>
  },
  [cardItems.updateApiName]: { 
    process: (params: unknown) => cardItems.process(
      params, 
      cardItems.updateApiName
    ) as Promise<unknown>
  },
  [cardItems.deleteApiName]: { 
    process: (params: unknown) => cardItems.process(
      params, 
      cardItems.deleteApiName
    ) as Promise<unknown>
  },
  [cardItems.getMonthlyTotalsApiName]: { 
    process: (params: unknown) => cardItems.process(
      params, 
      cardItems.getMonthlyTotalsApiName
    ) as Promise<unknown>
  },
  [cardItems.getLastUpdateApiName]: { 
    process: (params: unknown) => cardItems.process(
      params, 
      cardItems.getLastUpdateApiName
    ) as Promise<unknown>
  },
  [bankItems.getAllApiName]: {
    process: (params: unknown) => bankItems.process(
      params,
      bankItems.getAllApiName
    ) as Promise<unknown>
  },
  [bankItems.getByIdApiName]: {
    process: (params: unknown) => bankItems.process(
      params,
      bankItems.getByIdApiName
    ) as Promise<unknown>
  },
  [bankItems.updateApiName]: {
    process: (params: unknown) => bankItems.process(
      params,
      bankItems.updateApiName
    ) as Promise<unknown>
  },
  [bankItems.deleteApiName]: {
    process: (params: unknown) => bankItems.process(
      params,
      bankItems.deleteApiName
    ) as Promise<unknown>
  },
  [bankItems.getMonthlyTotalsApiName]: {
    process: (params: unknown) => bankItems.process(
      params,
      bankItems.getMonthlyTotalsApiName
    ) as Promise<unknown>
  },
};
