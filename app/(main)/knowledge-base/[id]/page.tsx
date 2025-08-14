"use client";

import { useParams } from "next/navigation";
import { Card } from "flowbite-react";

// Client component version of the dynamic KB detail page.
// We rely on useParams instead of receiving params as a Promise.
export default function KnowledgeBaseDetailPage() {
  const params = useParams<{ id: string }>();
  const idValue = Array.isArray(params?.id) ? params.id[0] : params?.id;

  return (
    <div className="p-6">
      <Card>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Knowledge Base Details
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Knowledge Base ID: {idValue || "Unknown"}
        </p>
        <div className="mt-4">
          <p className="text-gray-500 dark:text-gray-400">
            This page is under development. Knowledge base management features
            will be implemented here.
          </p>
        </div>
      </Card>
    </div>
  );
}
