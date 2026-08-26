"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { expenseApi } from "./expense.api";

export const expenseKeys = {
  all: ["expenses"],
  lists: () => [...expenseKeys.all, "list"],
  list: (params) => [...expenseKeys.lists(), params],
  detail: (id) => [...expenseKeys.all, "detail", id],
};

export function useExpenses(params = {}) {
  return useQuery({
    queryKey: expenseKeys.list(params),
    queryFn: () => expenseApi.list(params),
  });
}

export function useExpense(id, enabled = true) {
  return useQuery({
    queryKey: expenseKeys.detail(id),
    queryFn: () => expenseApi.getById(id),
    enabled: Boolean(id) && enabled,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: expenseApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => expenseApi.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(variables.id) });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: expenseApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
    },
  });
}
