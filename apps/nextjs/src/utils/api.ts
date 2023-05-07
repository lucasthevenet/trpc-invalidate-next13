"use server";

import { createTRPCNextCaller } from "@trpc/next-app-router";

import { appRouter, type AppRouter } from "@acme/api";
import { getServerSession } from "@acme/auth";
import { prisma } from "@acme/db";

export const api = createTRPCNextCaller<AppRouter>({
  router: appRouter,
  createContext: async () => ({
    prisma: prisma,
    session: await getServerSession(),
  }),
  revalidate: 40,
});

export { type RouterInputs, type RouterOutputs } from "@acme/api";
