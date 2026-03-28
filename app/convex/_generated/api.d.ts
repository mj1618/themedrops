/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as comments from "../comments.js";
import type * as notifications from "../notifications.js";
import type * as seed from "../seed.js";
import type * as themes from "../themes.js";
import type * as users from "../users.js";
import type * as auth from "../auth.js";
import type * as http from "../http.js";

/**
 * A utility for referencing Convex functions in your app's API.
 */
declare const fullApi: ApiFromModules<{
  comments: typeof comments;
  notifications: typeof notifications;
  seed: typeof seed;
  themes: typeof themes;
  users: typeof users;
  auth: typeof auth;
  http: typeof http;
}>;
export declare const api: FilterApi<typeof fullApi, FunctionReference<any, "public">>;
export declare const internal: FilterApi<typeof fullApi, FunctionReference<any, "internal">>;
