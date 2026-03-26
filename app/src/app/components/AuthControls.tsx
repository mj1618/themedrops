"use client";

import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect } from "react";
import AuthModal from "./AuthModal";

export default function AuthControls() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const currentUser = useQuery(
    api.users.getCurrentUser,
    isAuthenticated ? {} : "skip"
  );
  const ensureUser = useMutation(api.users.ensureUser);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      ensureUser().catch(() => {});
    }
  }, [isAuthenticated, ensureUser]);

  if (isLoading) {
    return (
      <div className="h-8 w-20 rounded-lg bg-gray-100 animate-pulse" />
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
        >
          Sign in
        </button>
        {showModal && <AuthModal onClose={() => setShowModal(false)} />}
      </>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600">
        {currentUser?.displayName ?? currentUser?.username ?? "..."}
      </span>
      <button
        onClick={() => signOut()}
        className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-all"
      >
        Sign out
      </button>
    </div>
  );
}
