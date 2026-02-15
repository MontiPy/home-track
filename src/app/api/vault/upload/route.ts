import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.householdId || !session.user.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const vaultItemId = formData.get("vaultItemId") as string | null;

    if (!file || !vaultItemId) {
      return NextResponse.json(
        { error: "File and vaultItemId are required" },
        { status: 400 }
      );
    }

    // Verify vault item exists and belongs to household
    const vaultItem = await db.vaultItem.findFirst({
      where: { id: vaultItemId, householdId: session.user.householdId },
    });

    if (!vaultItem) {
      return NextResponse.json(
        { error: "Vault item not found" },
        { status: 404 }
      );
    }

    // Check restricted access for CHILD role
    if (vaultItem.restricted && session.user.role === "CHILD") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Read file as base64 data URL (placeholder until Supabase Storage)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    const document = await db.vaultDocument.create({
      data: {
        fileName: file.name,
        fileUrl: dataUrl,
        fileType: file.type,
        vaultItemId,
        uploadedById: session.user.memberId,
      },
      include: {
        uploadedBy: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
