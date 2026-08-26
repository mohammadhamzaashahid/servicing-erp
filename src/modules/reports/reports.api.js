import { api } from "@/lib/api";
import { buildQuery } from "@/lib/format";

export const reportsApi = {
  dailyExpenses: async (params = {}) => {
    return api.get(`/reports/expenses-daily${buildQuery(params)}`);
  },

  incomeStatement: async (params = {}) => {
    return api.get(`/reports/income-statement${buildQuery(params)}`);
  },
};
