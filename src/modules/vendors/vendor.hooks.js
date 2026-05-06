"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vendorApi } from "./vendor.api";

export const vendorKeys = {
  all: ["vendors"],
  lists: () => [...vendorKeys.all, "list"],
  list: (params) => [...vendorKeys.lists(), params],
  detail: (id) => [...vendorKeys.all, "detail", id],
};

export function useVendors(params = {}) {
  return useQuery({
    queryKey: vendorKeys.list(params),
    queryFn: () => vendorApi.list(params),
  });
}

export function useVendor(id, enabled = true) {
  return useQuery({
    queryKey: vendorKeys.detail(id),
    queryFn: () => vendorApi.getById(id),
    enabled: Boolean(id) && enabled,
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: vendorApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: vendorKeys.lists(),
      });
    },
  });
}

export function useUpdateVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => vendorApi.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: vendorKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: vendorKeys.detail(variables.id),
      });
    },
  });
}

export function useDeleteVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: vendorApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: vendorKeys.lists(),
      });
    },
  });
}