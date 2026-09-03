import { api } from "@/lib/api";
import { buildQuery } from "@/lib/format";

export const productPurchasingApi = {
  list: async (params = {}) => {
    return api.get(`/product-purchasing${buildQuery(params)}`);
  },

  getById: async (id) => {
    return api.get(`/product-purchasing/${id}`);
  },

  create: async (payload) => {
    return api.post("/product-purchasing", payload);
  },

  remove: async (id) => {
    return api.delete(`/product-purchasing/${id}`);
  },
};
