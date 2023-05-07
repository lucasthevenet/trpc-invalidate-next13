"use client";

import { signIn, signOut } from "next-auth/react";

export const AuthButton = ({ isLoggedIn }: { isLoggedIn?: boolean }) => (
  <button
    className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
    onClick={isLoggedIn ? () => void signOut() : () => void signIn()}
  >
    {isLoggedIn ? "Sign out" : "Sign in"}
  </button>
);
