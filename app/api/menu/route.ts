import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const menu = await prisma.menuItem.findMany({
      where: {
        active: true,
      },
      orderBy: [
        { favorite: "desc" },
        { category: "asc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json(menu);
  } catch (error) {
    console.error("Menu fetch error:", error);

    return NextResponse.json([], {
      status: 200,
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { restaurantId, name, price, category } = body;

    if (!restaurantId || !name || !price || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const item = await prisma.menuItem.create({
      data: {
        restaurantId,
        name,
        price,
        category,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Menu create error:", error);

    return NextResponse.json(
      { error: "Failed to create menu item" },
      { status: 500 }
    );
  }
}