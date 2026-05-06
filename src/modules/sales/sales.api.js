import { api } from "@/lib/api";
import { buildQuery } from "@/lib/format";

export const salesApi = {
  list: async (params = {}) => {
    return api.get(`/sales${buildQuery(params)}`);
  },

  getById: async (id) => {
    return api.get(`/sales/${id}`);
  },

  create: async (payload) => {
    return api.post("/sales", payload);
  },

  getPrintHtml: async (id) => {
    return api.getRaw(`/sales/${id}/print`);
  },
};