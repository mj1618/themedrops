# Theme Collections

Users can create named collections of themes (like playlists or mood boards). Collections are shareable and viewable on user profiles.

## Why

Currently there's no way to organize or group themes. Users can star individual themes, but can't curate themed sets like "Dark Coding Themes" or "Pastel Vibes." Collections add an organizational and social layer that encourages engagement and discovery.

## Schema

Add to `convex/schema.ts`:

- **`collections`** table:
  - `name: v.string()` — collection title
  - `description: v.optional(v.string())` — optional description
  - `userId: v.id("users")` — owner
  - `isPublic: v.boolean()` — visibility (default true)
  - Indexes: `by_user` on `userId`

- **`collectionItems`** table:
  - `collectionId: v.id("collections")` — parent collection
  - `themeId: v.id("themes")` — theme in collection
  - `order: v.number()` — display order
  - Indexes: `by_collection` on `collectionId`, `by_theme` on `themeId`

## Backend — `convex/collections.ts`

- `create` mutation — create a new collection (auth required)
- `update` mutation — edit name/description/visibility (owner only)
- `delete` mutation — delete collection and its items (owner only)
- `addTheme` mutation — add a theme to a collection (owner only, prevent duplicates)
- `removeTheme` mutation — remove a theme from a collection (owner only)
- `get` query — get a single collection by ID with its themes
- `listByUser` query — get all collections for a user (public only if not owner)

## Frontend

### Route: `app/routes/collection/$collectionId.tsx`
- Display collection name, description, author
- Grid of theme cards (reuse existing `ThemeCard` component)
- Edit/delete controls if the viewer is the owner
- Share button to copy link

### Route: `app/routes/user/$username.tsx` (modify existing)
- Add a "Collections" tab alongside existing themes list
- Show collection cards with name, theme count, and a small preview strip of the first 3-4 theme colors

### Component: `app/components/AddToCollectionModal.tsx`
- Triggered from theme detail page (add a "Add to Collection" button near the star/fork buttons)
- Shows user's existing collections with checkboxes
- Option to create a new collection inline
- Only shown to authenticated users

### Component: `app/components/CollectionCard.tsx`
- Card for displaying a collection in lists
- Shows collection name, theme count, color preview strip from first few themes

## Tasks

- [x] Add `collections` and `collectionItems` tables to schema
- [x] Implement `convex/collections.ts` with all mutations and queries
- [x] Create `CollectionCard.tsx` component
- [x] Create `AddToCollectionModal.tsx` component
- [x] Create collection detail page route
- [x] Add "Collections" tab to user profile page
- [x] Add "Add to Collection" button on theme detail page
- [x] Test in browser — create collection, add themes, view collection page, view on profile

## Done

Completed by agent. All tasks implemented:

- **Schema**: Added `collections` and `collectionItems` tables with indexes to `convex/schema.ts`
- **Backend**: Created `convex/collections.ts` with `create`, `update`, `remove`, `addTheme`, `removeTheme`, `get`, `listByUser`, and `listMyCollections` (extra helper for the modal) queries/mutations
- **CollectionCard**: Shows color preview strip from first 4 themes, name, description, and theme count
- **AddToCollectionModal**: Shows user's collections with checkboxes to toggle theme membership, inline new collection creation
- **Collection detail page**: `/collection/$collectionId` route with theme grid, edit/delete/share controls for owners, remove-theme buttons
- **User profile**: Added Themes/Collections tab switcher to `/user/$username`
- **Theme detail page**: Added "Collect" button next to Share, opens AddToCollectionModal (requires auth)
- TypeScript compiles clean, Vite build succeeds, app renders correctly in browser
