"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { expenseCategoryApi } from "./expenseCategory.api";

export const expenseCategoryKeys = {
  all: ["expenseCategories"],
  lists: () => [...expenseCategoryKeys.all, "list"],
  list: (params) => [...expenseCategoryKeys.lists(), params],
  detail: (id) => [...expenseCategoryKeys.all, "detail", id],
};

export function useExpenseCategories(params = {}) {
  return useQuery({
    queryKey: expenseCategoryKeys.list(params),
    queryFn: () => expenseCategoryApi.list(params),
  });
}

export function useExpenseCategory(id, enabled = true) {
  return useQuery({
    queryKey: expenseCategoryKeys.detail(id),
    queryFn: () => expenseCategoryApi.getById(id),
    enabled: Boolean(id) && enabled,
  });
}

export function useCreateExpenseCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: expenseCategoryApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseCategoryKeys.lists() });
    },
  });
}

export function useUpdateExpenseCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => expenseCategoryApi.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: expenseCategoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: expenseCategoryKeys.detail(variables.id) });
    },
  });
}

export function useDeleteExpenseCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: expenseCategoryApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseCategoryKeys.lists() });
    },
  });
}
