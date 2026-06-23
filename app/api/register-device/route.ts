
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { restaurantId, pin, deviceName } = await req.json();

    if (!restaurantId || !pin || !deviceName) {
      return NextResponse.json(
        {
          success: false,
          error: "Restaurant ID, PIN and device name are required",
        },
        { status: 400 }
      );
    }

    // Verify restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: {
        id: restaurantId,
      },
    });

    if (!restaurant) {
      return NextResponse.json(
        {
          success: false,
          error: "Restaurant not found",
        },
        { status: 404 }
      );
    }

    // Find owner
    const owner = await prisma.staff.findFirst({
      where: {
        restaurantId,
        role: "OWNER",
        active: true,
      },
    });

    if (!owner) {
      return NextResponse.json(
        {
          success: false,
          error: "Owner account not found",
        },
        { status: 404 }
      );
    }

    // Verify PIN
    const validPin = await bcrypt.compare(pin, owner.pinHash);

    if (!validPin) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid PIN",
        },
        { status: 401 }
      );
    }

    // Create device
    const device = await prisma.device.create({
      data: {
        restaurantId,
        deviceName,
      },
    });

    return NextResponse.json({
      success: true,
      deviceId: device.id,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      deviceName: device.deviceName,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to register device",
      },
      { status: 500 }
    );
  }
}
