import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const restaurantId = "cmqozgzvm0000chv476atrllj";
    
    const startDateParam = req.nextUrl.searchParams.get("startDate");
    const endDateParam = req.nextUrl.searchParams.get("endDate");

    let startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Default to last 30 days
    startDate.setHours(0, 0, 0, 0);

    let endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    // Override with query params if provided
    if (startDateParam) {
      startDate = new Date(startDateParam);
      startDate.setHours(0, 0, 0, 0);
    }
    if (endDateParam) {
      endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);
    }

    // Fetch bills with items in date range
    const bills = await prisma.bill.findMany({
      where: {
        restaurantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: true,
      },
    });

    // Calculate summary metrics
    const billCount = bills.length;
    const totalSales = bills.reduce(
      (sum, bill) => sum + Number(bill.totalAmount),
      0
    );
    const averageBill = billCount > 0 ? totalSales / billCount : 0;

    // Payment mode breakdown
    const cashBills = bills.filter((b) => b.paymentMode === "CASH");
    const upiBills = bills.filter((b) => b.paymentMode === "UPI");
    const cardBills = bills.filter((b) => b.paymentMode === "CARD");

    const cashSales = cashBills.reduce(
      (sum, bill) => sum + Number(bill.totalAmount),
      0
    );
    const upiSales = upiBills.reduce(
      (sum, bill) => sum + Number(bill.totalAmount),
      0
    );
    const cardSales = cardBills.reduce(
      (sum, bill) => sum + Number(bill.totalAmount),
      0
    );

    // Top selling items
    const itemMap = new Map<
      string,
      { itemName: string; qty: number; revenue: number; price: number }
    >();

    bills.forEach((bill) => {
      bill.items.forEach((item) => {
        const key = item.menuItemId || item.itemName;
        if (itemMap.has(key)) {
          const existing = itemMap.get(key)!;
          existing.qty += item.qty;
          existing.revenue += Number(item.lineTotal);
        } else {
          itemMap.set(key, {
            itemName: item.itemName,
            qty: item.qty,
            revenue: Number(item.lineTotal),
            price: Number(item.price),
          });
        }
      });
    });

    const topItems = Array.from(itemMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return NextResponse.json({
      summary: {
        totalSales: Math.round(totalSales * 100) / 100,
        billCount,
        averageBill: Math.round(averageBill * 100) / 100,
        cashSales: Math.round(cashSales * 100) / 100,
        upiSales: Math.round(upiSales * 100) / 100,
        cardSales: Math.round(cardSales * 100) / 100,
        cashCount: cashBills.length,
        upiCount: upiBills.length,
        cardCount: cardBills.length,
      },
      topItems: topItems.map((item) => ({
        itemName: item.itemName,
        qty: item.qty,
        revenue: Math.round(item.revenue * 100) / 100,
        avgPrice: Math.round((item.revenue / item.qty) * 100) / 100,
      })),
      dateRange: {
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      },
    });
  } catch (error) {
    console.error("Reports error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
