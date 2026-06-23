import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const menu = await prisma.menuItem.findMany({
      where: {
        active: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    console.log("MENU:", menu);

    return NextResponse.json(menu);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to load menu" },
      { status: 500 }
    );
  }
}