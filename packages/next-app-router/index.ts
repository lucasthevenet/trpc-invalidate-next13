import { revalidateTag, unstable_cache } from "next/cache";
import {
  type AnyMutationProcedure,
  type AnyProcedure,
  type AnyQueryProcedure,
  type AnyRouter,
  type AnySubscriptionProcedure,
  type ProcedureArgs,
  type ProcedureRouterRecord,
  type ProcedureType,
} from "@trpc/server";
import { createRecursiveProxy } from "@trpc/server/shared";

type Resolver<TProcedure extends AnyProcedure> = (
  input: ProcedureArgs<TProcedure["_def"]>[0],
) => Promise<TProcedure["_def"]["_output_out"]>;

type QueryResolver<TProcedure extends AnyProcedure> = (
  ...args: [
    input: ProcedureArgs<TProcedure["_def"]>[0],
    opts?: {
      revalidate?: number | false;
    },
  ]
) => Promise<TProcedure["_def"]["_output_out"]>;

type DecorateProcedure<TProcedure extends AnyProcedure> =
  TProcedure extends AnyQueryProcedure
    ? {
        query: QueryResolver<TProcedure>;
        invalidate(): void;
      }
    : TProcedure extends AnyMutationProcedure
    ? {
        mutate: Resolver<TProcedure>;
      }
    : TProcedure extends AnySubscriptionProcedure
    ? {
        subscribe: Resolver<TProcedure>;
      }
    : never;

type DecoratedProcedureRecord<TProcedures extends ProcedureRouterRecord> = {
  [TKey in keyof TProcedures]: TProcedures[TKey] extends ProcedureRouterRecord
    ? DecoratedProcedureRecord<TProcedures[TKey]>
    : TProcedures[TKey] extends AnyRouter
    ? DecoratedProcedureRecord<TProcedures[TKey]["_def"]["record"]>
    : TProcedures[TKey] extends AnyProcedure
    ? DecorateProcedure<TProcedures[TKey]>
    : never;
};

type RouterCaller<TRouter extends AnyRouter> = (
  ctx: TRouter["_def"]["_config"]["$types"]["ctx"],
) => DecoratedProcedureRecord<TRouter["_def"]["record"]>;

type CreateTRPCNextRouterOptions<TRouter extends AnyRouter> = {
  router: TRouter;
  revalidate: number | false;
  createContext: () =>
    | Promise<TRouter["_def"]["_config"]["$types"]["ctx"]>
    | TRouter["_def"]["_config"]["$types"]["ctx"];
};

export function createTRPCNextCaller<TRouter extends AnyRouter>(
  config: CreateTRPCNextRouterOptions<TRouter>,
) {
  const { router, revalidate, createContext } = config;
  const proxy = createRecursiveProxy(async ({ args, path }) => {
    const lastPart = path.pop();
    const fullPath = path.join(".");

    const procedure = router._def.procedures[fullPath] as AnyProcedure;
    const tags = args[0]
      ? [fullPath, fullPath + JSON.stringify(args[0])]
      : [fullPath];

    let type: ProcedureType = "query";

    if (procedure._def.mutation) {
      type = "mutation";
    } else if (procedure._def.subscription) {
      type = "subscription";
    }

    if (type === "query" && lastPart === "invalidate") {
      for (const tag of tags) {
        revalidateTag(tag);
      }
      return;
    }

    // not sure when to call this but this place is good enough
    const ctx = await createContext();

    if (type === "query") {
      const queryOptions = (args[1] || {}) as { revalidate?: number | false };

      return unstable_cache(
        async () =>
          procedure({
            path: fullPath,
            rawInput: args[0],
            ctx,
            type,
          }),
        path, // <- what does this do?
        {
          // allow overriding revalidate time from caller
          revalidate: queryOptions.revalidate ?? revalidate,
          tags: tags,
        },
      )();
    }

    return procedure({
      path: fullPath,
      rawInput: args[0],
      ctx,
      type,
    });
  });

  return proxy as ReturnType<RouterCaller<TRouter>>;
}
