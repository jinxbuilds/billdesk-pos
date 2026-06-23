import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { restaurantId, pin } = await req.json();
    if (!restaurantId || !pin) {
  return NextResponse.json(
    { error: "Restaurant ID and PIN are required" },
    { status: 400 }
  );
}

    const owner = await prisma.staff.findFirst({
      where: {
        restaurantId,
        role: "OWNER",
        active: true,
      },
    });

    if (!owner) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    const valid = await bcrypt.compare(pin, owner.pinHash);

    if (!valid) {
      return NextResponse.json(
        { error: "Invalid PIN" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      staffId: owner.id,
      restaurantId,
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return NextResponse.json(
      {
        error: "Login failed",
        details: String(error),
      },
      { status: 500 }
    );
  }
}
