import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const menu = await prisma.menuItem.findMany({
      where: {
        active: true,
      },
    });

    return NextResponse.json(menu);
  } catch (error) {
    console.error("Menu fetch error:", error);

    return NextResponse.json([], {
      status: 200,
    });
  }
}