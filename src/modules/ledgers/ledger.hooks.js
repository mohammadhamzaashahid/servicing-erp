"use client";

import { useQuery } from "@tanstack/react-query";
import { ledgerApi } from "./ledger.api";

export const ledgerKeys = {
  all: ["ledgers"],
  entries: () => [...ledgerKeys.all, "entries"],
  entryList: (params) => [...ledgerKeys.entries(), params],
  daybook: () => [...ledgerKeys.all, "daybook"],
  daybookList: (params) => [...ledgerKeys.daybook(), params],
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