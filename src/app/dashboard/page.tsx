import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/db";
import { DiagramList } from "./diagram-list";

export default async function Dashboard() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const prisma = getPrisma();
  const diagrams = await prisma.diagram.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      createdAt: true,
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            My Diagrams
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Create and manage your causal loop diagrams
          </p>
        </div>
      </div>

      <DiagramList
        initialDiagrams={diagrams.map((d) => ({
          ...d,
          updatedAt: d.updatedAt.toISOString(),
          createdAt: d.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
