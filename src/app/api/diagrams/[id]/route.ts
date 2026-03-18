import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

// GET /api/diagrams/[id] — get a single diagram
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = getPrisma();
  const diagram = await prisma.diagram.findFirst({
    where: { id, user: { email: session.user.email } },
  });

  if (!diagram) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(diagram);
}

// PUT /api/diagrams/[id] — update a diagram (title, data, isPublic)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = getPrisma();

  // Verify ownership
  const existing = await prisma.diagram.findFirst({
    where: { id, user: { email: session.user.email } },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const updateData: Record<string, unknown> = {};

  if (body.title !== undefined) updateData.title = body.title;
  if (body.data !== undefined) updateData.data = body.data;
  if (body.isPublic !== undefined) updateData.isPublic = body.isPublic;

  const diagram = await prisma.diagram.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(diagram);
}

// DELETE /api/diagrams/[id] — delete a diagram
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = getPrisma();

  // Verify ownership
  const existing = await prisma.diagram.findFirst({
    where: { id, user: { email: session.user.email } },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.diagram.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
