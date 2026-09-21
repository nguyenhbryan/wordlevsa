import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { deleteScore } from "@/lib/data";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin(request))) {
    return NextResponse.json(
      { error: "Your admin session has expired." },
      { status: 401 },
    );
  }

  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  }

  try {
    const deleted = await deleteScore(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "That submission no longer exists." },
        { status: 404 },
      );
    }
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "The submission could not be deleted." },
      { status: 500 },
    );
  }
}
