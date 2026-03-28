import { ConvexReactClient, ConvexProvider } from "convex/react";
import { ConvexAuthProvider as ConvexAuthProviderBase } from "@convex-dev/auth/react";
import { type ReactNode, useState, useEffect } from "react";

// Use a placeholder URL that will never actually connect
const PLACEHOLDER_URL = "https://placeholder.convex.cloud";

function getConvexUrl() {
  if (typeof window !== "undefined") {
    return (import.meta as any).env?.VITE_CONVEX_URL || PLACEHOLDER_URL;
  }
  return process.env.VITE_CONVEX_URL || PLACEHOLDER_URL;
}

export function ConvexAuthProvider({ children }: { children: ReactNode }) {
  const url = getConvexUrl();
  const isPlaceholder = url === PLACEHOLDER_URL;

  const [client] = useState(() => new ConvexReactClient(url));

  // If using a real URL, wrap with auth provider for full functionality
  if (!isPlaceholder) {
    return (
      <ConvexAuthProviderBase client={client}>
        {children}
      </ConvexAuthProviderBase>
    );
  }

  // With placeholder, just provide the base ConvexProvider so hooks don't crash
  return (
    <ConvexProvider client={client}>
      {children}
    </ConvexProvider>
  );
}
