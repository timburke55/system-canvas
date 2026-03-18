import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { DiagramList } from "./DiagramList";

export default async function Dashboard() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/");
  }

  const prisma = getPrisma();
  const diagrams = await prisma.diagram.findMany({
    where: { user: { email: session.user.email } },
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
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          My Diagrams
        </h1>
      </div>
      <DiagramList initialDiagrams={diagrams} />
    </div>
  );
}
