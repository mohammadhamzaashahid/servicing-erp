"use client";

import { useQuery } from "@tanstack/react-query";
import { inventoryApi } from "./inventory.api";

export const inventoryKeys = {
  all: ["inventory"],
  movements: () => [...inventoryKeys.all, "movements"],
  movementList: (params) => [...inventoryKeys.movements(), params],
  stockSummary: () => [...inventoryKeys.all, "stockSummary"],
  stockSummaryList: (params) => [...inventoryKeys.stockSummary(), params],
};

export function useInventoryMovements(params = {}) {
  return useQuery({
    queryKey: inventoryKeys.movementList(params),
    queryFn: () => inventoryApi.listMovements(params),
  });
}

export function useStockSummary(params = {}) {
  return useQuery({
    queryKey: inventoryKeys.stockSummaryList(params),
    queryFn: () => inventoryApi.stockSummary(params),
  });
}