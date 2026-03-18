import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

// GET /api/diagrams — list current user's diagrams
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  return NextResponse.json(diagrams);
}

// POST /api/diagrams — create a new diagram
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const title = body.title || "Untitled Diagram";

  const prisma = getPrisma();
  const diagram = await prisma.diagram.create({
    data: {
      title,
      data: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
      userId: session.user.id,
    },
  });

  return NextResponse.json(diagram, { status: 201 });
}
