import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, type FormEvent } from "react";
import { AuthModal } from "../components/AuthModal";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const user = useQuery(api.users.currentUser);
  const updateProfile = useMutation(api.users.updateProfile);
  const [showAuth, setShowAuth] = useState(false);

  if (user === undefined) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="h-64 rounded-2xl bg-td-secondary animate-pulse" />
      </div>
    );
  }

  if (user === null) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-td-foreground">
          Sign in to edit your profile
        </h1>
        <button
          onClick={() => setShowAuth(true)}
          className="px-6 py-2.5 rounded-xl bg-td-primary text-white font-medium hover:bg-td-primary/90 transition-colors"
        >
          Sign In
        </button>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-td-foreground">Edit Profile</h1>
      <ProfileForm
        initialDisplayName={user.displayName ?? ""}
        initialBio={user.bio ?? ""}
        initialAvatarUrl={user.avatarUrl ?? ""}
        username={user.username ?? ""}
        onSave={async (values) => {
          await updateProfile({
            displayName: values.displayName,
            bio: values.bio,
            avatarUrl: values.avatarUrl,
          });
        }}
        onDone={() =>
          navigate({
            to: "/user/$username",
            params: { username: user.username ?? "" },
          })
        }
      />
    </div>
  );
}

function ProfileForm({
  initialDisplayName,
  initialBio,
  initialAvatarUrl,
  username,
  onSave,
  onDone,
}: {
  initialDisplayName: string;
  initialBio: string;
  initialAvatarUrl: string;
  username: string;
  onSave: (values: {
    displayName: string;
    bio: string;
    avatarUrl: string;
  }) => Promise<void>;
  onDone: () => void;
}) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const trimmedDisplayName = displayName.trim();
    const trimmedBio = bio.trim();
    const trimmedAvatarUrl = avatarUrl.trim();

    if (trimmedAvatarUrl) {
      try {
        new URL(trimmedAvatarUrl);
      } catch {
        setError("Avatar URL must be a valid URL");
        setLoading(false);
        return;
      }
    }

    try {
      await onSave({
        displayName: trimmedDisplayName,
        bio: trimmedBio,
        avatarUrl: trimmedAvatarUrl,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const avatarLetter = (displayName.trim() || username || "?")[0].toUpperCase();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 text-sm rounded-lg bg-green-500/10 text-green-400 border border-green-500/20">
          Profile updated!
        </div>
      )}

      {/* Avatar preview */}
      <div className="flex items-center gap-4">
        {avatarUrl.trim() ? (
          <img
            src={avatarUrl.trim()}
            alt="Avatar"
            className="w-16 h-16 rounded-2xl object-cover bg-td-secondary"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              (
                e.target as HTMLImageElement
              ).nextElementSibling?.classList.remove("hidden");
            }}
          />
        ) : null}
        <div
          className={`w-16 h-16 rounded-2xl bg-td-primary/20 flex items-center justify-center text-td-primary text-2xl font-bold ${avatarUrl.trim() ? "hidden" : ""}`}
        >
          {avatarLetter}
        </div>
        <div>
          <p className="text-sm font-medium text-td-foreground">
            {displayName.trim() || username}
          </p>
          <p className="text-xs text-td-muted">@{username}</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-td-foreground mb-1">
          Display Name
        </label>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-td-secondary border border-white/10 text-td-foreground focus:outline-none focus:ring-2 focus:ring-td-primary/50"
          placeholder={username}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-td-foreground mb-1">
          Bio
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, 200))}
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-td-secondary border border-white/10 text-td-foreground focus:outline-none focus:ring-2 focus:ring-td-primary/50 resize-none"
          placeholder="Tell us about yourself..."
        />
        <p className="text-xs text-td-muted mt-1">{bio.length}/200</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-td-foreground mb-1">
          Avatar URL
        </label>
        <input
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-td-secondary border border-white/10 text-td-foreground focus:outline-none focus:ring-2 focus:ring-td-primary/50"
          placeholder="https://example.com/avatar.jpg"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl bg-td-primary text-white font-medium hover:bg-td-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? "Saving..." : success ? "Saved!" : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="px-6 py-2.5 rounded-xl bg-td-secondary text-td-foreground font-medium border border-white/10 hover:border-white/20 transition-colors"
        >
          Back to Profile
        </button>
      </div>
    </form>
  );
}
