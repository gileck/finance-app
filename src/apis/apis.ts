import { ApiHandlers } from "./types";
import * as chat from "./chat/server";
import * as clearCache from "./settings/clearCache/server";
import * as fileManagement from "./fileManagement/server";
import * as aiUsage from "./monitoring/aiUsage/server";
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
};
