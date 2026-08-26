"use client";

import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "./reports.api";

export const reportsKeys = {
  all: ["reports"],
  dailyExpenses: (params) => [...reportsKeys.all, "dailyExpenses", params],
  incomeStatement: (params) => [...reportsKeys.all, "incomeStatement", params],
};

export function useDailyExpenseReport(params) {
  return useQuery({
    queryKey: reportsKeys.dailyExpenses(params),
    queryFn: () => reportsApi.dailyExpenses(params),
    enabled: Boolean(params?.from && params?.to),
  });
}

export function useIncomeStatement(params) {
  return useQuery({
    queryKey: reportsKeys.incomeStatement(params),
    queryFn: () => reportsApi.incomeStatement(params),
    enabled: Boolean(params?.from && params?.to),
  });
}
