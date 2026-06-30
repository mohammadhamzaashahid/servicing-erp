import { api } from "@/lib/api";
import { buildQuery } from "@/lib/format";

export const ledgerApi = {
  listEntries: async (params = {}) => {
    return api.get(`/ledgers/entries${buildQuery(params)}`);
  },

  listDaybook: async (params = {}) => {
    return api.get(`/ledgers/daybook${buildQuery(params)}`);
  },

  getCustomerStatement: async (customerId, params = {}) => {
    return api.get(`/ledgers/customers/${customerId}${buildQuery(params)}`);
  },

  recordCustomerPayment: async (customerId, payload) => {
    return api.post(`/ledgers/customers/${customerId}/payments`, payload);
  },

  getVendorStatement: async (vendorId, params = {}) => {
    return api.get(`/ledgers/vendors/${vendorId}${buildQuery(params)}`);
  },

  recordVendorPayment: async (vendorId, payload) => {
    return api.post(`/ledgers/vendors/${vendorId}/payments`, payload);
  },
};
