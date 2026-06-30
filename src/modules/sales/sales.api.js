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

  update: async ({ id, ...payload }) => {
    return api.patch(`/sales/${id}`, payload);
  },

  remove: async (id) => {
    return api.delete(`/sales/${id}`);
  },

  getPrintHtml: async (id) => {
    return api.getRaw(`/sales/${id}/print`);
  },
};
