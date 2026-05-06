import { api } from "@/lib/api";
import { buildQuery } from "@/lib/format";

export const rawMaterialApi = {
  list: async (params = {}) => {
    return api.get(`/raw-materials${buildQuery(params)}`);
  },

  getById: async (id) => {
    return api.get(`/raw-materials/${id}`);
  },

  create: async (payload) => {
    return api.post("/raw-materials", payload);
  },

  update: async (id, payload) => {
    return api.patch(`/raw-materials/${id}`, payload);
  },

  remove: async (id) => {
    return api.delete(`/raw-materials/${id}`);
  },
};