"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { salesApi } from "./sales.api";
import { productKeys } from "@/modules/products/product.hooks";
import { customerKeys } from "@/modules/customers/customer.hooks";

export const salesKeys = {
  all: ["sales"],
  lists: () => [...salesKeys.all, "list"],
  list: (params) => [...salesKeys.lists(), params],
  detail: (id) => [...salesKeys.all, "detail", id],
};

export function useSalesInvoices(params = {}) {
  return useQuery({
    queryKey: salesKeys.list(params),
    queryFn: () => salesApi.list(params),
  });
}

export function useSalesInvoice(id, enabled = true) {
  return useQuery({
    queryKey: salesKeys.detail(id),
    queryFn: () => salesApi.getById(id),
    enabled: Boolean(id) && enabled,
  });
}

export function useCreateSalesInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: salesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: salesKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: productKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: customerKeys.lists(),
      });
    },
  });
}

export function useUpdateSalesInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: salesApi.update,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: salesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: salesKeys.detail(data?.id) });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}

export function useDeleteSalesInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: salesApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["ledgers"] });
    },
  });
}
