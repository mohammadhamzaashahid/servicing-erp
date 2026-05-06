import { api } from "@/lib/api";
import { buildQuery } from "@/lib/format";

export const unitApi = {
  list: async (params = {}) => {
    return api.get(`/units${buildQuery(params)}`);
  },

  getById: async (id) => {
    return api.get(`/units/${id}`);
  },

  create: async (payload) => {
    return api.post("/units", payload);
  },

  update: async (id, payload) => {
    return api.patch(`/units/${id}`, payload);
  },

  remove: async (id) => {
    return api.delete(`/units/${id}`);
  },
};