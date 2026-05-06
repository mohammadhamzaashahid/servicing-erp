import { api } from "@/lib/api";
import { buildQuery } from "@/lib/format";

export const productApi = {
  list: async (params = {}) => {
    return api.get(`/products${buildQuery(params)}`);
  },

  getById: async (id) => {
    return api.get(`/products/${id}`);
  },

  create: async (payload) => {
    return api.post("/products", payload);
  },

  update: async (id, payload) => {
    return api.patch(`/products/${id}`, payload);
  },

  remove: async (id) => {
    return api.delete(`/products/${id}`);
  },
};