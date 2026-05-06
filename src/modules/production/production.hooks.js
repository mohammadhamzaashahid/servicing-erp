"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productionApi } from "./production.api";
import { rawMaterialKeys } from "@/modules/rawMaterials/rawMaterial.hooks";
import { productKeys } from "@/modules/products/product.hooks";

export const productionKeys = {
  all: ["production"],
  lists: () => [...productionKeys.all, "list"],
  list: (params) => [...productionKeys.lists(), params],
  detail: (id) => [...productionKeys.all, "detail", id],
};

export function useProductionBatches(params = {}) {
  return useQuery({
    queryKey: productionKeys.list(params),
    queryFn: () => productionApi.list(params),
  });
}

export function useProductionBatch(id, enabled = true) {
  return useQuery({
    queryKey: productionKeys.detail(id),
    queryFn: () => productionApi.getById(id),
    enabled: Boolean(id) && enabled,
  });
}

export function useCreateProductionBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productionApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: productionKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: rawMaterialKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: productKeys.lists(),
      });
    },
  });
}