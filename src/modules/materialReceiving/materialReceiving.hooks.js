"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { materialReceivingApi } from "./materialReceiving.api";
import { rawMaterialKeys } from "@/modules/rawMaterials/rawMaterial.hooks";
import { vendorKeys } from "@/modules/vendors/vendor.hooks";

export const materialReceivingKeys = {
  all: ["materialReceiving"],
  lists: () => [...materialReceivingKeys.all, "list"],
  list: (params) => [...materialReceivingKeys.lists(), params],
  detail: (id) => [...materialReceivingKeys.all, "detail", id],
};

export function useMaterialReceipts(params = {}) {
  return useQuery({
    queryKey: materialReceivingKeys.list(params),
    queryFn: () => materialReceivingApi.list(params),
  });
}

export function useMaterialReceipt(id, enabled = true) {
  return useQuery({
    queryKey: materialReceivingKeys.detail(id),
    queryFn: () => materialReceivingApi.getById(id),
    enabled: Boolean(id) && enabled,
  });
}

export function useCreateMaterialReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: materialReceivingApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialReceivingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: rawMaterialKeys.lists() });
      queryClient.invalidateQueries({ queryKey: vendorKeys.lists() });
    },
  });
}

export function useDeleteMaterialReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: materialReceivingApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialReceivingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: rawMaterialKeys.lists() });
      queryClient.invalidateQueries({ queryKey: vendorKeys.lists() });
    },
  });
}