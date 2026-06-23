import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log("Receipt bill ID:", id);

    const bill = await prisma.bill.findUnique({
      where: { id },
      include: {
        items: true,
        restaurant: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log("Bill found:", !!bill);

    if (!bill) {
      return NextResponse.json(
        { error: "Bill not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(bill);
  } catch (error) {
    console.error("Fetch bill error:", error);

    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}