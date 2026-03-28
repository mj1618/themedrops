import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from "@tanstack/react-router";
import { timeAgo } from "../lib/timeAgo";

const ACTION_TEXT: Record<string, string> = {
  star: "starred your theme",
  comment: "commented on",
  fork: "forked your theme",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unreadCount = useQuery(api.notifications.unreadCount);
  const { results, loadMore, status } = usePaginatedQuery(
    api.notifications.list,
    {},
    { initialNumItems: 20 }
  );
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-1.5 text-td-muted hover:text-td-foreground transition-colors"
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-2.83-2h5.66A3 3 0 0110 18z" />
        </svg>
        {!!unreadCount && unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-td-accent text-white text-[10px] font-bold leading-none px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-white/10 bg-td-secondary/95 backdrop-blur-xl shadow-2xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-sm font-semibold text-td-foreground">
              Notifications
            </span>
            {!!unreadCount && unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="text-xs text-td-primary hover:text-td-accent transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-td-muted">
              No notifications yet
            </div>
          ) : (
            <div>
              {results.map((n) => (
                <Link
                  key={n._id}
                  to="/theme/$slug"
                  params={{ slug: n.theme.slug }}
                  onClick={() => {
                    if (!n.read) markAsRead({ id: n._id });
                    setOpen(false);
                  }}
                  className={`block px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0 ${
                    !n.read ? "bg-td-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && (
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-td-accent shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-td-foreground leading-snug">
                        <span className="font-medium">
                          {n.actor.displayName}
                        </span>{" "}
                        <span className="text-td-muted">
                          {ACTION_TEXT[n.type]}
                        </span>{" "}
                        <span className="font-medium">{n.theme.name}</span>
                      </p>
                      <p className="text-xs text-td-muted mt-0.5">
                        {timeAgo(n._creationTime)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
              {status === "CanLoadMore" && (
                <button
                  onClick={() => loadMore(20)}
                  className="w-full px-4 py-2.5 text-xs text-td-primary hover:text-td-accent transition-colors text-center border-t border-white/5"
                >
                  Load more
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
