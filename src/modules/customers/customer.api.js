import { api } from "@/lib/api";
import { buildQuery } from "@/lib/format";

export const customerApi = {
  list: async (params = {}) => {
    return api.get(`/customers${buildQuery(params)}`);
  },

  getById: async (id) => {
    return api.get(`/customers/${id}`);
  },

  create: async (payload) => {
    return api.post("/customers", payload);
  },

  update: async (id, payload) => {
    return api.patch(`/customers/${id}`, payload);
  },

  remove: async (id) => {
    return api.delete(`/customers/${id}`);
  },
};