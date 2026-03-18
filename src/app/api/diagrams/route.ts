import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

// GET /api/diagrams — list current user's diagrams
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  return NextResponse.json(diagrams);
}

// POST /api/diagrams — create a new diagram
export async function POST() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const diagram = await prisma.diagram.create({
    data: {
      userId: user.id,
      data: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
    },
  });

  return NextResponse.json(diagram, { status: 201 });
}
