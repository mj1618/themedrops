import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider as ConvexAuthProviderBase } from "@convex-dev/auth/react";
import { type ReactNode, useState } from "react";

const PLACEHOLDER_URL = "https://placeholder.convex.cloud";

function getConvexUrl() {
  return (import.meta as any).env?.VITE_CONVEX_URL || PLACEHOLDER_URL;
}

export function ConvexAuthProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => new ConvexReactClient(getConvexUrl()));

  return (
    <ConvexAuthProviderBase client={client}>
      {children}
    </ConvexAuthProviderBase>
  );
}
