"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { unitApi } from "./unit.api";

export const unitKeys = {
  all: ["units"],
  lists: () => [...unitKeys.all, "list"],
  list: (params) => [...unitKeys.lists(), params],
  detail: (id) => [...unitKeys.all, "detail", id],
};

export function useUnits(params = {}) {
  return useQuery({
    queryKey: unitKeys.list(params),
    queryFn: () => unitApi.list(params),
  });
}

export function useUnit(id, enabled = true) {
  return useQuery({
    queryKey: unitKeys.detail(id),
    queryFn: () => unitApi.getById(id),
    enabled: Boolean(id) && enabled,
  });
}

export function useCreateUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unitApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: unitKeys.lists(),
      });
    },
  });
}

export function useUpdateUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => unitApi.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: unitKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: unitKeys.detail(variables.id),
      });
    },
  });
}

export function useDeleteUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unitApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: unitKeys.lists(),
      });
    },
  });
}