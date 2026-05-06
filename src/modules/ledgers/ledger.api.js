import { api } from "@/lib/api";
import { buildQuery } from "@/lib/format";

export const ledgerApi = {
  listEntries: async (params = {}) => {
    return api.get(`/ledgers/entries${buildQuery(params)}`);
  },

  listDaybook: async (params = {}) => {
    return api.get(`/ledgers/daybook${buildQuery(params)}`);
  },
};