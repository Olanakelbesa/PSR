

import { readyForFundingService } from "@/api/services/ready-for-funding.service";

export const readyForFundingQueries = {
  list: (params?: any) => readyForFundingService.list(params),
};

export const readyForFundingMutations = {
  createDecision: (id: string | number, payload: any) =>
    readyForFundingService.createDecision(id, payload),
};