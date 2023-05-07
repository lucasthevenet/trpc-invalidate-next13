"use server";

import { createTRPCNextCaller } from "@trpc/next-app-router";

import { appRouter, createTRPCContext, type AppRouter } from "@acme/api";

export const api = createTRPCNextCaller<AppRouter>({
  router: appRouter,
  createContext: createTRPCContext,
  revalidate: 40,
});

export { type RouterInputs, type RouterOutputs } from "@acme/api";
