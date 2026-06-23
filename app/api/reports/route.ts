import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const restaurantId = "cmqozgzvm0000chv476atrllj";

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch all bills created today
    const bills = await prisma.bill.findMany({
      where: {
        restaurantId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      select: {
        id: true,
        totalAmount: true,
        paymentMode: true,
      },
    });

    // Calculate metrics
    const billCount = bills.length;
    const totalSales = bills.reduce(
      (sum, bill) => sum + Number(bill.totalAmount),
      0
    );

    const cashSales = bills
      .filter((bill) => bill.paymentMode === "CASH")
      .reduce((sum, bill) => sum + Number(bill.totalAmount), 0);

    const upiSales = bills
      .filter((bill) => bill.paymentMode === "UPI")
      .reduce((sum, bill) => sum + Number(bill.totalAmount), 0);

    const averageBill = billCount > 0 ? totalSales / billCount : 0;

    return NextResponse.json({
      totalSales: Math.round(totalSales * 100) / 100,
      billCount,
      cashSales: Math.round(cashSales * 100) / 100,
      upiSales: Math.round(upiSales * 100) / 100,
      averageBill: Math.round(averageBill * 100) / 100,
    });
  } catch (error) {
    console.error("Reports error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
