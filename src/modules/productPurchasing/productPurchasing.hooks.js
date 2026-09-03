"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productPurchasingApi } from "./productPurchasing.api";
import { productKeys } from "@/modules/products/product.hooks";
import { vendorKeys } from "@/modules/vendors/vendor.hooks";

export const productPurchasingKeys = {
  all: ["productPurchasing"],
  lists: () => [...productPurchasingKeys.all, "list"],
  list: (params) => [...productPurchasingKeys.lists(), params],
  detail: (id) => [...productPurchasingKeys.all, "detail", id],
};

export function useProductPurchases(params = {}) {
  return useQuery({
    queryKey: productPurchasingKeys.list(params),
    queryFn: () => productPurchasingApi.list(params),
  });
}

export function useProductPurchase(id, enabled = true) {
  return useQuery({
    queryKey: productPurchasingKeys.detail(id),
    queryFn: () => productPurchasingApi.getById(id),
    enabled: Boolean(id) && enabled,
  });
}

export function useCreateProductPurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productPurchasingApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productPurchasingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: vendorKeys.lists() });
    },
  });
}

export function useDeleteProductPurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productPurchasingApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productPurchasingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: vendorKeys.lists() });
    },
  });
}
