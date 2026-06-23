import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("BODY:", JSON.stringify(body, null, 2));

    const {
      restaurantId,
      deviceId,
      staffId,
      paymentMode,
      items,
      clientBillId: providedClientBillId,
    } = body;

    // Use provided clientBillId or generate new one
    const clientBillId = providedClientBillId || crypto.randomUUID();

    // Check if bill already exists (idempotency)
    const existingBill = await prisma.bill.findFirst({
      where: {
        restaurantId,
        clientBillId,
      },
    });

    if (existingBill) {
      // Return existing bill if already created
      return NextResponse.json(
        await prisma.bill.findUnique({
          where: { id: existingBill.id },
          include: { items: true },
        })
      );
    }

    const subtotal = items.reduce(
      (sum: number, item: any) => sum + Number(item.price) * Number(item.qty),
      0
    );

    const bill = await prisma.$transaction(async (tx) => {
      const restaurant = await tx.restaurant.update({
        where: { id: restaurantId },
        data: {
          nextBillNumber: {
            increment: 1,
          },
        },
      });

      return tx.bill.create({
        data: {
          restaurantId,
          billNumber: restaurant.nextBillNumber,
          clientBillId,

          deviceId,
          staffId,

          subtotal,
          totalAmount: subtotal,

          paymentMode,
          status: "COMPLETED",

          items: {
            create: items.map((item: any) => ({
              menuItemId: item.id,
              itemName: item.name,
              price: item.price,
              qty: item.qty,
              lineTotal: Number(item.price) * Number(item.qty),
            })),
          },
        },
        include: {
          items: true,
        },
      });
    });

    return NextResponse.json(bill);
  } catch (error) {
    console.error("FULL ERROR:", error);

    return NextResponse.json(
      {
        error: String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const bills = await prisma.bill.findMany({
    include: {
      items: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(bills);
}