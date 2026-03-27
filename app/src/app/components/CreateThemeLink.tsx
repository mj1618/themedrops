"use client";

import { useConvexAuth } from "convex/react";
import Link from "next/link";

export default function CreateThemeLink() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading || !isAuthenticated) return null;

  return (
    <Link
      href="/create"
      className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
    >
      + Create
    </Link>
  );
}
