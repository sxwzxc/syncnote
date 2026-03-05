import type { Route } from "./+types/home";
import { Link } from "react-router";
import { PageLayout } from "~/components/layout";
import { Button } from "~/components/ui/button";
import { FileText, PlusCircle } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "SyncNote — Online Notes" },
    {
      name: "description",
      content:
        "SyncNote: a simple online notes application backed by EdgeOne KV storage.",
    },
  ];
}

export default function Home() {
  return (
    <PageLayout>
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-12 h-12 text-primary" />
          <h1 className="text-5xl font-bold text-gray-900">SyncNote</h1>
        </div>
        <p className="text-xl text-gray-600 mb-2 max-w-lg">
          Your personal online notes, synced and stored in the cloud.
        </p>
        <p className="text-base text-gray-400 mb-10 max-w-md">
          Create, edit, and delete notes from anywhere. All data is persisted
          using EdgeOne KV storage.
        </p>
        <Link to="/notes">
          <Button
            size="lg"
            className="bg-primary hover:bg-primary-dark text-white cursor-pointer px-8 py-3 text-lg"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Open Notes
          </Button>
        </Link>
      </div>
    </PageLayout>
  );
}
