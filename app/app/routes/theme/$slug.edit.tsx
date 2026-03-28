import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ThemeForm } from "../../components/ThemeForm";
import { useToast } from "../../components/Toast";

export const Route = createFileRoute("/theme/$slug/edit")({
  component: EditThemePage,
});

function EditThemePage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const theme = useQuery(api.themes.getBySlug, { slug });
  const updateTheme = useMutation(api.themes.update);

  if (theme === undefined) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="h-64 rounded-2xl bg-td-secondary animate-pulse" />
      </div>
    );
  }

  if (!theme || !theme.isOwner) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-td-foreground">Not authorized</h1>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-td-foreground mb-8">Edit Theme</h1>
      <ThemeForm
        initialValues={{
          name: theme.name,
          description: theme.description ?? "",
          colors: theme.colors,
          fonts: theme.fonts,
          isPublic: theme.isPublic,
        }}
        onSubmit={async (values) => {
          const newSlug = await updateTheme({
            id: theme._id,
            name: values.name,
            description: values.description,
            colors: values.colors,
            fonts: values.fonts,
            isPublic: values.isPublic,
          });
          toast("Theme updated successfully!", "success");
          navigate({ to: "/theme/$slug", params: { slug: newSlug ?? slug } });
        }}
        submitLabel="Save Changes"
      />
    </div>
  );
}
