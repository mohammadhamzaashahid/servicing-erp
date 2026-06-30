import { api } from "@/lib/api";
import { buildQuery } from "@/lib/format";

export const productionApi = {
  list: async (params = {}) => {
    return api.get(`/production${buildQuery(params)}`);
  },

  getById: async (id) => {
    return api.get(`/production/${id}`);
  },

  create: async (payload) => {
    return api.post("/production", payload);
  },

  remove: async (id) => {
    return api.delete(`/production/${id}`);
  },
};