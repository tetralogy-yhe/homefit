"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="text-sm text-gray-400 hover:text-red-500 transition-colors"
    >
      로그아웃
    </button>
  );
}
