import { Suspense } from "react";

import { api, type RouterOutputs } from "~/utils/api";
import { AuthButton } from "./auth-button";

const PostCard: React.FC<{
  post: RouterOutputs["post"]["all"]["items"][number];
}> = ({ post }) => {
  return (
    <div className="flex flex-row rounded-lg bg-white/10 p-4 transition-all hover:scale-[101%]">
      <div className="flex-grow">
        <h2 className="text-2xl font-bold text-pink-400">{post.title}</h2>
        <p className="mt-2 text-sm">{post.content}</p>
      </div>
      <form
        // @ts-expect-error ts is brok (?
        action={async (v: FormData) => {
          "use server";
          const id = v.get("id") as string;
          await api.post.delete.mutate(id);

          api.post.all.invalidate();
        }}
      >
        <input type="hidden" name="id" value={post.id} />
        <button
          className="cursor-pointer text-sm font-bold uppercase text-pink-400"
          type="submit"
        >
          Delete
        </button>
      </form>
    </div>
  );
};

const CreatePostForm = () => {
  return (
    <form
      className="flex w-full max-w-2xl flex-col p-4"
      // @ts-expect-error ts is brok (?
      action={async (data: FormData) => {
        "use server";
        const title = data.get("title") as string;
        const content = data.get("content") as string;

        await api.post.create.mutate({
          title,
          content,
        });

        api.post.all.invalidate();
      }}
    >
      <input
        className="mb-2 rounded bg-white/10 p-2 text-white"
        name="title"
        placeholder="Title"
      />
      <input
        className="mb-2 rounded bg-white/10 p-2 text-white"
        name="content"
        placeholder="Content"
      />
      <button className="rounded bg-pink-400 p-2 font-bold" type="submit">
        Create
      </button>
    </form>
  );
};

const PostList = async () => {
  const postQuery = await api.post.all.query();

  return (
    <div className="w-full max-w-2xl">
      <p className="-mt-4 mb-2 text-lg font-semibold">
        Fetched posts at {new Date(postQuery.fetchedAt).toLocaleTimeString()} in{" "}
        {postQuery.duration} ms.
      </p>
      {postQuery.items?.length === 0 ? (
        <span>There are no posts!</span>
      ) : (
        <div className="flex h-[40vh] justify-center overflow-y-scroll px-4 text-2xl">
          <div className="flex w-full flex-col gap-4">
            {postQuery.items?.map((p) => {
              return <PostCard key={p.id} post={p} />;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

function Page() {
  return (
    <main className="flex h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container mt-12 flex flex-col items-center justify-center gap-4 px-4 py-8">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Create <span className="text-pink-400">T3</span> Turbo
        </h1>
        <Suspense fallback={"loading..."}>
          {/* @ts-expect-error RSC */}
          <AuthShowcase />
        </Suspense>

        <CreatePostForm />
        <Suspense fallback={"loading..."}>
          {/* @ts-expect-error RSC */}
          <PostList />
        </Suspense>
      </div>
    </main>
  );
}

export default Page;

const AuthShowcase = async () => {
  const session = await api.auth.getSession.query();

  const secretMessage =
    !!session?.user && (await api.auth.getSecretMessage.query());

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {session?.user && (
        <p className="text-center text-2xl text-white">
          {session && <span>Logged in as {session?.user?.name}</span>}
          {secretMessage && <span> - {secretMessage}</span>}
        </p>
      )}
      <AuthButton isLoggedIn={!!session} />
    </div>
  );
};
