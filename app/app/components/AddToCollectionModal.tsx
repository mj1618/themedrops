import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

type AddToCollectionModalProps = {
  themeId: string;
  onClose: () => void;
};

export function AddToCollectionModal({ themeId, onClose }: AddToCollectionModalProps) {
  const collections = useQuery(api.collections.listMyCollections, {
    themeId: themeId as any,
  });
  const addTheme = useMutation(api.collections.addTheme);
  const removeTheme = useMutation(api.collections.removeTheme);
  const createCollection = useMutation(api.collections.create);

  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const handleToggle = async (collectionId: string, hasTheme: boolean) => {
    setToggling(collectionId);
    try {
      if (hasTheme) {
        await removeTheme({ collectionId: collectionId as any, themeId: themeId as any });
      } else {
        await addTheme({ collectionId: collectionId as any, themeId: themeId as any });
      }
    } catch {
      // error handled silently
    } finally {
      setToggling(null);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const id = await createCollection({ name: newName.trim() });
      await addTheme({ collectionId: id, themeId: themeId as any });
      setNewName("");
      setShowCreate(false);
    } catch {
      // error handled silently
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md mx-4 bg-td-secondary rounded-2xl border border-white/10 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-td-foreground">Add to Collection</h2>
          <button
            onClick={onClose}
            className="text-td-muted hover:text-td-foreground transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {collections === undefined ? (
          <div className="py-8 text-center text-td-muted text-sm">Loading...</div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {collections.length === 0 && !showCreate && (
              <p className="text-td-muted text-sm text-center py-4">
                No collections yet. Create one below!
              </p>
            )}
            {collections.map((collection) => (
              <button
                key={collection._id}
                onClick={() => handleToggle(collection._id, collection.hasTheme)}
                disabled={toggling === collection._id}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-td-background/50 transition-colors disabled:opacity-50 text-left"
              >
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                    collection.hasTheme
                      ? "bg-td-primary border-td-primary"
                      : "border-white/20"
                  }`}
                >
                  {collection.hasTheme && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-td-foreground truncate">{collection.name}</span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-white/10">
          {showCreate ? (
            <div className="flex gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Collection name"
                autoFocus
                disabled={creating}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                className="flex-1 px-3 py-2 rounded-lg bg-td-background border border-white/10 text-td-foreground text-sm placeholder:text-td-muted/50 focus:outline-none focus:ring-2 focus:ring-td-primary/30 disabled:opacity-50"
              />
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="px-3 py-2 rounded-lg bg-td-primary text-white text-sm font-medium disabled:opacity-50"
              >
                {creating ? "..." : "Add"}
              </button>
              <button
                onClick={() => {
                  setShowCreate(false);
                  setNewName("");
                }}
                disabled={creating}
                className="px-3 py-2 rounded-lg bg-td-background text-td-muted text-sm border border-white/10"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowCreate(true)}
              className="w-full flex items-center gap-2 justify-center px-3 py-2 rounded-xl text-sm font-medium text-td-primary hover:bg-td-primary/10 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Collection
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
