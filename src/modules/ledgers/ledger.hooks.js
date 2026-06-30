"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ledgerApi } from "./ledger.api";
import { customerKeys } from "@/modules/customers/customer.hooks";
import { salesKeys } from "@/modules/sales/sales.hooks";

export const ledgerKeys = {
  all: ["ledgers"],
  entries: () => [...ledgerKeys.all, "entries"],
  entryList: (params) => [...ledgerKeys.entries(), params],
  daybook: () => [...ledgerKeys.all, "daybook"],
  daybookList: (params) => [...ledgerKeys.daybook(), params],
  customerStatements: () => [...ledgerKeys.all, "customer-statements"],
  customerStatement: (customerId, params) => [
    ...ledgerKeys.customerStatements(),
    customerId,
    params,
  ],
};

export function useLedgerEntries(params = {}) {
  return useQuery({
    queryKey: ledgerKeys.entryList(params),
    queryFn: () => ledgerApi.listEntries(params),
  });
}

export function useDaybookEntries(params = {}) {
  return useQuery({
    queryKey: ledgerKeys.daybookList(params),
    queryFn: () => ledgerApi.listDaybook(params),
  });
}

export function useCustomerStatement(customerId, params = {}) {
  return useQuery({
    queryKey: ledgerKeys.customerStatement(customerId, params),
    queryFn: () => ledgerApi.getCustomerStatement(customerId, params),
    enabled: Boolean(customerId),
  });
}

export function useRecordCustomerPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ customerId, payload }) =>
      ledgerApi.recordCustomerPayment(customerId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ledgerKeys.customerStatements(),
      });
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: salesKeys.lists() });
    },
  });
}
