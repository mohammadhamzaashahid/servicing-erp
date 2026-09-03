import { api } from "@/lib/api";
import { buildQuery } from "@/lib/format";

export const inventoryApi = {
  listMovements: async (params = {}) => {
    return api.get(`/inventory/movements${buildQuery(params)}`);
  },

  stockSummary: async (params = {}) => {
    return api.get(`/inventory/stock-summary${buildQuery(params)}`);
  },
};