# Fix theme detail page bugs

## Context
The theme detail page (`app/src/app/theme/[slug]/page.tsx`) has three bugs that will cause runtime errors or broken behavior for forked themes. These need to be fixed before the page is shippable.

## Bugs

### 1. Missing `api.themes.getBasicInfo` query — runtime error
- **File:** `app/src/app/theme/[slug]/page.tsx` line 108
- **Problem:** The page calls `useQuery(api.themes.getBasicInfo, ...)` but this function does not exist in `app/convex/themes.ts`. This will cause a build/runtime error whenever a forked theme is viewed.
- **Fix:** Add a `getBasicInfo` query to `app/convex/themes.ts` that takes an `id` (theme ID) and returns just `{ name, slug }` for linking purposes. It should only return info for public themes (or themes owned by the viewer).

### 2. Fork redirect uses wrong slug
- **File:** `app/src/app/theme/[slug]/page.tsx` lines 161-168
- **Problem:** After forking, the frontend constructs the slug as `theme.slug + "-fork"`, but the backend (`themes.fork` mutation) generates the slug from `uniqueSlug(original.name + " fork")` which is name-based, not slug-based. The fork mutation already returns `{ id, slug }` but the frontend ignores the returned slug.
- **Fix:** Use the `slug` from the fork mutation's return value (`forkedId.slug`) to navigate to the new theme. The variable `forkedId` is misleadingly named — it's actually `{ id, slug }`. Rename it and use the returned slug directly:
  ```ts
  const result = await forkTheme({ id: theme._id });
  if (result) {
    router.push(`/theme/${result.slug}`);
  }
  ```

### 3. "Forked from" should link to parent theme
- **File:** `app/src/app/theme/[slug]/page.tsx` lines 227-230
- **Problem:** The forked-from notice just says "Forked from another theme" as static text. The `forkedFrom` query result (once bug #1 is fixed) contains the parent theme's name and slug, but they're not used.
- **Fix:** Use the `forkedFrom` data to show the parent theme name as a clickable link:
  ```tsx
  {theme.forkedFromId && forkedFrom && (
    <p className="text-sm text-gray-400 italic">
      Forked from <a href={`/theme/${forkedFrom.slug}`} className="text-blue-500 hover:underline">{forkedFrom.name}</a>
    </p>
  )}
  ```

## Acceptance criteria
- [x] `themes.getBasicInfo` query exists and returns `{ name, slug }` for a given theme ID
- [x] Forked theme detail pages load without errors (no missing function crash)
- [x] Forking a theme navigates to the correct slug using the mutation return value
- [x] "Forked from" text links to the parent theme's detail page with parent theme name
- [x] TypeScript compiles cleanly

## Technical notes
- The `getBasicInfo` query should respect privacy — don't return info for private themes unless the viewer is the author
- The fork mutation return type is `{ id: Id<"themes">, slug: string }` — already has everything needed
- No new dependencies required

## Completion notes
All three bugs fixed:
1. Added `themes.getBasicInfo` query in `app/convex/themes.ts` — returns `{ name, slug }` for a given theme ID, with privacy checks (returns null for private themes unless viewer is author)
2. Fixed fork redirect in `page.tsx` — renamed `forkedId` to `result` and used `result.slug` directly instead of constructing a wrong slug
3. Updated "Forked from" text to show parent theme name as a clickable link using the `forkedFrom` query data
TypeScript compiles cleanly with no errors.
