import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { ThemeCard } from "../../components/ThemeCard";
import { useToast } from "../../components/Toast";

export const Route = createFileRoute("/collection/$collectionId")({
  component: CollectionDetailPage,
});

function CollectionDetailPage() {
  const { collectionId } = Route.useParams();
  const { toast } = useToast();
  const collection = useQuery(api.collections.get, {
    id: collectionId as any,
  });
  const user = useQuery(api.users.currentUser);
  const updateCollection = useMutation(api.collections.update);
  const deleteCollection = useMutation(api.collections.remove);
  const removeTheme = useMutation(api.collections.removeTheme);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  if (collection === undefined) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="h-32 rounded-2xl bg-td-secondary animate-pulse" />
      </div>
    );
  }

  if (collection === null) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-td-foreground">Collection not found</h1>
        <Link to="/" className="text-td-primary mt-4 inline-block">
          Go back home
        </Link>
      </div>
    );
  }

  const handleEdit = () => {
    setEditName(collection.name);
    setEditDesc(collection.description ?? "");
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateCollection({
        id: collectionId as any,
        name: editName.trim() || collection.name,
        description: editDesc.trim() || undefined,
      });
      setEditing(false);
      toast("Collection updated", "success");
    } catch {
      toast("Failed to update collection", "error");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this collection?")) return;
    setDeleteLoading(true);
    try {
      await deleteCollection({ id: collectionId as any });
      toast("Collection deleted", "success");
      window.history.back();
    } catch {
      toast("Failed to delete collection", "error");
      setDeleteLoading(false);
    }
  };

  const handleRemoveTheme = async (themeId: string) => {
    try {
      await removeTheme({
        collectionId: collectionId as any,
        themeId: themeId as any,
      });
      toast("Theme removed from collection", "success");
    } catch {
      toast("Failed to remove theme", "error");
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/collection/${collectionId}`;
    navigator.clipboard.writeText(url);
    toast("Link copied to clipboard", "success");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        {editing ? (
          <div className="space-y-3">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-td-background border border-white/10 text-td-foreground text-lg font-bold focus:outline-none focus:ring-2 focus:ring-td-primary/30"
              autoFocus
            />
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-td-background border border-white/10 text-td-foreground text-sm focus:outline-none focus:ring-2 focus:ring-td-primary/30 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-td-primary text-white text-sm font-medium"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-lg bg-td-secondary text-td-muted text-sm border border-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-td-foreground">{collection.name}</h1>
            {collection.description && (
              <p className="text-td-muted">{collection.description}</p>
            )}
            {collection.owner && (
              <p className="text-sm text-td-muted">
                by{" "}
                <Link
                  to="/user/$username"
                  params={{ username: collection.owner.username }}
                  className="text-td-accent hover:underline"
                >
                  {collection.owner.displayName}
                </Link>
              </p>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-td-secondary text-td-foreground border border-white/10 hover:border-white/20 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>

          {collection.isOwner && !editing && (
            <>
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-td-secondary text-td-foreground border border-white/10 hover:border-white/20 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Themes grid */}
      <div>
        <h2 className="text-lg font-bold text-td-foreground mb-4">
          {collection.themes.length} {collection.themes.length === 1 ? "Theme" : "Themes"}
        </h2>
        {collection.themes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {collection.themes.map((theme: any) => (
              <div key={theme._id} className="relative group/card">
                <ThemeCard theme={theme} />
                {collection.isOwner && (
                  <button
                    onClick={() => handleRemoveTheme(theme._id)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white/70 hover:text-red-400 opacity-0 group-hover/card:opacity-100 transition-all"
                    title="Remove from collection"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-td-muted text-sm text-center py-8">
            This collection is empty.
          </p>
        )}
      </div>
    </div>
  );
}
