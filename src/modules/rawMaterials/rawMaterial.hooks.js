"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { rawMaterialApi } from "./rawMaterial.api";

export const rawMaterialKeys = {
  all: ["rawMaterials"],
  lists: () => [...rawMaterialKeys.all, "list"],
  list: (params) => [...rawMaterialKeys.lists(), params],
  detail: (id) => [...rawMaterialKeys.all, "detail", id],
};

export function useRawMaterials(params = {}) {
  return useQuery({
    queryKey: rawMaterialKeys.list(params),
    queryFn: () => rawMaterialApi.list(params),
  });
}

export function useRawMaterial(id, enabled = true) {
  return useQuery({
    queryKey: rawMaterialKeys.detail(id),
    queryFn: () => rawMaterialApi.getById(id),
    enabled: Boolean(id) && enabled,
  });
}

export function useCreateRawMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rawMaterialApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: rawMaterialKeys.lists(),
      });
    },
  });
}

export function useUpdateRawMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => rawMaterialApi.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: rawMaterialKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: rawMaterialKeys.detail(variables.id),
      });
    },
  });
}

export function useDeleteRawMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rawMaterialApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: rawMaterialKeys.lists(),
      });
    },
  });
}