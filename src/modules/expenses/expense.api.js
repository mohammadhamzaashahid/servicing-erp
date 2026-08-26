import { api } from "@/lib/api";
import { buildQuery } from "@/lib/format";

export const expenseApi = {
  list: async (params = {}) => {
    return api.get(`/expenses${buildQuery(params)}`);
  },

  getById: async (id) => {
    return api.get(`/expenses/${id}`);
  },

  create: async (payload) => {
    return api.post("/expenses", payload);
  },

  update: async (id, payload) => {
    return api.patch(`/expenses/${id}`, payload);
  },

  remove: async (id) => {
    return api.delete(`/expenses/${id}`);
  },
};
