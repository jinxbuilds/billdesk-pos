import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Update menu item details
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const item = await prisma.menuItem.update({
      where: { id },
      data: {
        name: body.name,
        price: body.price,
        category: body.category,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Menu update error:", error);

    return NextResponse.json(
      { error: "Failed to update menu item" },
      { status: 500 }
    );
  }
}

// Enable / Disable menu item
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const item = await prisma.menuItem.update({
      where: { id },
      data: {
        active: body.active,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Menu status update error:", error);

    return NextResponse.json(
      { error: "Failed to update item status" },
      { status: 500 }
    );
  }
}