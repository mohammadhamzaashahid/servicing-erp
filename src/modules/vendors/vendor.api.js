import { api } from "@/lib/api";
import { buildQuery } from "@/lib/format";

export const vendorApi = {
  list: async (params = {}) => {
    return api.get(`/vendors${buildQuery(params)}`);
  },

  getById: async (id) => {
    return api.get(`/vendors/${id}`);
  },

  create: async (payload) => {
    return api.post("/vendors", payload);
  },

  update: async (id, payload) => {
    return api.patch(`/vendors/${id}`, payload);
  },

  remove: async (id) => {
    return api.delete(`/vendors/${id}`);
  },
};