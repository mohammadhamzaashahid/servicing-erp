"use client";

import { useQuery } from "@tanstack/react-query";
import { inventoryApi } from "./inventory.api";

export const inventoryKeys = {
  all: ["inventory"],
  movements: () => [...inventoryKeys.all, "movements"],
  movementList: (params) => [...inventoryKeys.movements(), params],
};

export function useInventoryMovements(params = {}) {
  return useQuery({
    queryKey: inventoryKeys.movementList(params),
    queryFn: () => inventoryApi.listMovements(params),
  });
}