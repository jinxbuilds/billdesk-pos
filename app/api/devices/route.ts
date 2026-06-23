import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deviceId, deviceName, restaurantId } = body;

    if (!deviceId || !deviceName || !restaurantId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const device = await prisma.device.upsert({
      where: {
        id: deviceId,
      },
      update: {
        deviceName,
        lastSeenAt: new Date(),
      },
      create: {
        id: deviceId,
        restaurantId,
        deviceName,
      },
    });

    return NextResponse.json(device);
  } catch (error) {
    console.error("Device registration error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const deviceId = req.nextUrl.searchParams.get("deviceId");
    const restaurantId = req.nextUrl.searchParams.get("restaurantId");

    if (!deviceId || !restaurantId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const device = await prisma.device.findFirst({
      where: {
        id: deviceId,
        restaurantId,
      },
    });

    if (!device) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(device);
  } catch (error) {
    console.error("Fetch device error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}