import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/db";

export default async function DiagramEditor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const prisma = getPrisma();
  const diagram = await prisma.diagram.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!diagram) {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {diagram.title}
        </h1>
        <span className="text-xs text-zinc-400">
          Canvas editor coming in Phase 3
        </span>
      </div>
      <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <p className="text-zinc-500 dark:text-zinc-400">
          The React Flow canvas will be implemented in Phase 3.
        </p>
      </div>
    </div>
  );
}
