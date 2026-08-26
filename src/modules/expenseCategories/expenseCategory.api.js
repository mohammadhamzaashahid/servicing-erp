import { api } from "@/lib/api";
import { buildQuery } from "@/lib/format";

export const expenseCategoryApi = {
  list: async (params = {}) => {
    return api.get(`/expense-categories${buildQuery(params)}`);
  },

  getById: async (id) => {
    return api.get(`/expense-categories/${id}`);
  },

  create: async (payload) => {
    return api.post("/expense-categories", payload);
  },

  update: async (id, payload) => {
    return api.patch(`/expense-categories/${id}`, payload);
  },

  remove: async (id) => {
    return api.delete(`/expense-categories/${id}`);
  },
};
