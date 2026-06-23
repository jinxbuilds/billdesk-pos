import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { deviceId, pin } = await req.json();

    if (!deviceId || !pin) {
      return NextResponse.json(
        { error: "Device ID and PIN are required" },
        { status: 400 }
      );
    }

    const device = await prisma.device.findUnique({
      where: {
        id: deviceId,
      },
    });

    if (!device) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 }
      );
    }

    const restaurantId = device.restaurantId;

    const owner = await prisma.staff.findFirst({
      where: {
        restaurantId,
        role: "OWNER",
        active: true,
      },
    });

    if (!owner) {
      return NextResponse.json(
        { error: "Owner account not found" },
        { status: 404 }
      );
    }

    const valid = await bcrypt.compare(
      pin,
      owner.pinHash
    );

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
      deviceId: device.id,
      deviceName: device.deviceName,
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