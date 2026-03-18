"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface DiagramSummary {
  id: string;
  title: string;
  updatedAt: Date;
  createdAt: Date;
}

export function DiagramList({
  initialDiagrams,
}: {
  initialDiagrams: DiagramSummary[];
}) {
  const router = useRouter();
  const [diagrams, setDiagrams] = useState(initialDiagrams);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function createDiagram() {
    setCreating(true);
    try {
      const res = await fetch("/api/diagrams", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create diagram");
      const diagram = await res.json();
      router.push(`/diagram/${diagram.id}`);
    } catch {
      setCreating(false);
    }
  }

  async function deleteDiagram(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/diagrams/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete diagram");
      setDiagrams((prev) => prev.filter((d) => d.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="mt-6">
        <Button onClick={createDiagram} disabled={creating}>
          {creating ? "Creating..." : "+ New Diagram"}
        </Button>
      </div>

      {diagrams.length === 0 ? (
        <p className="mt-8 text-center text-zinc-500 dark:text-zinc-400">
          No diagrams yet. Create one to get started!
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {diagrams.map((diagram) => (
            <li
              key={diagram.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            >
              <button
                onClick={() => router.push(`/diagram/${diagram.id}`)}
                className="flex-1 text-left"
              >
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {diagram.title}
                </span>
                <span className="ml-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {new Date(diagram.updatedAt).toLocaleDateString()}
                </span>
              </button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300"
                onClick={() => deleteDiagram(diagram.id)}
                disabled={deletingId === diagram.id}
              >
                {deletingId === diagram.id ? "Deleting..." : "Delete"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
