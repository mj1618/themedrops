import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ThemeForm } from "../components/ThemeForm";
import { AuthModal } from "../components/AuthModal";
import { useState } from "react";

export const Route = createFileRoute("/create")({
  component: CreateThemePage,
});

function CreateThemePage() {
  const navigate = useNavigate();
  const user = useQuery(api.users.currentUser);
  const createTheme = useMutation(api.themes.create);
  const [showAuth, setShowAuth] = useState(false);

  if (user === undefined) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="h-64 rounded-2xl bg-td-secondary animate-pulse" />
      </div>
    );
  }

  if (user === null) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-td-foreground">Sign in to create a theme</h1>
        <button
          onClick={() => setShowAuth(true)}
          className="px-6 py-2.5 rounded-xl bg-td-primary text-white font-medium"
        >
          Sign In
        </button>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-td-foreground mb-8">Create a Theme</h1>
      <ThemeForm
        initialValues={{
          name: "",
          description: "",
          colors: {
            background: "#0a0a0b",
            foreground: "#fafafa",
            primary: "#6d28d9",
            secondary: "#1e1e2e",
            accent: "#f472b6",
            muted: "#71717a",
          },
          fonts: {
            heading: "Inter",
            body: "Inter",
            mono: "JetBrains Mono",
          },
          tags: [],
          isPublic: true,
        }}
        onSubmit={async (values) => {
          await createTheme({
            ...values,
            tags: values.tags.length > 0 ? values.tags : undefined,
          });
          navigate({ to: "/" });
        }}
        submitLabel="Create Theme"
      />
    </div>
  );
}
