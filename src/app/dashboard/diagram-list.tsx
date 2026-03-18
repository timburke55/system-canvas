"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DiagramSummary {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
}

export function DiagramList({ initialDiagrams }: { initialDiagrams: DiagramSummary[] }) {
  const [diagrams, setDiagrams] = useState(initialDiagrams);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  async function createDiagram() {
    setCreating(true);
    try {
      const res = await fetch("/api/diagrams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed to create diagram");
      const diagram = await res.json();
      router.push(`/diagram/${diagram.id}`);
    } catch (e) {
      console.error(e);
      setCreating(false);
    }
  }

  async function deleteDiagram(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/diagrams/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete diagram");
      setDiagrams((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="mt-8">
      <Button onClick={createDiagram} disabled={creating}>
        {creating ? "Creating..." : "New Diagram"}
      </Button>

      {diagrams.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-zinc-500 dark:text-zinc-400">
            No diagrams yet. Create your first one to get started.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {diagrams.map((diagram) => (
            <Card
              key={diagram.id}
              className="group cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => router.push(`/diagram/${diagram.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate">{diagram.title}</CardTitle>
                    <CardDescription className="mt-1">
                      Updated {formatDate(diagram.updatedAt)}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteDiagram(diagram.id);
                    }}
                    disabled={deletingId === diagram.id}
                  >
                    {deletingId === diagram.id ? "..." : "Delete"}
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
