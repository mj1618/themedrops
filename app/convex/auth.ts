import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { Value } from "convex/values";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params: Record<string, Value | undefined>) {
        const username = (params.email as string) ?? "";
        return {
          email: username.includes("@")
            ? username
            : `${username}@themedrops.local`,
          username,
          displayName: username,
          tokenIdentifier: "",
        };
      },
    }),
  ],
});
