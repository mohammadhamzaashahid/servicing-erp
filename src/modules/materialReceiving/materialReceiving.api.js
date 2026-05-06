import { api } from "@/lib/api";
import { buildQuery } from "@/lib/format";

export const materialReceivingApi = {
  list: async (params = {}) => {
    return api.get(`/material-receiving${buildQuery(params)}`);
  },

  getById: async (id) => {
    return api.get(`/material-receiving/${id}`);
  },

  create: async (payload) => {
    return api.post("/material-receiving", payload);
  },
};