import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import { prisma } from "@/lib/prisma";
import { getUserIdFromToken } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false },
        { status: 401 }
      );
    }

    const userId = getUserIdFromToken(token);

    if (!userId) {
      return NextResponse.json(
        { success: false },
        { status: 401 }
      );
    }
const { paymentId } = await params;
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId,
      },
      include: {
        user: true,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false },
        { status: 404 }
      );
    }

    const pdf = await PDFDocument.create();

    const page = pdf.addPage([595, 842]);

    const { width, height } = page.getSize();

    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const regular = await pdf.embedFont(StandardFonts.Helvetica);

    page.drawText("ESOP VALUE CLARITY", {
      x: 50,
      y: height - 60,
      size: 22,
      font: bold,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText("Invoice", {
      x: 50,
      y: height - 95,
      size: 16,
      font: bold,
    });

    let y = height - 150;

    const row = (label: string, value: string) => {
      page.drawText(label, {
        x: 50,
        y,
        size: 11,
        font: bold,
      });

      page.drawText(value, {
        x: 190,
        y,
        size: 11,
        font: regular,
      });

      y -= 28;
    };

    row(
      "Invoice Number",
      `INV-${payment.createdAt.getTime()}`
    );

    row("Customer", payment.user.name);

    row("Email", payment.user.email);

    row("Plan", payment.plan);

    row(
      "Billing",
      payment.billingCycle.replace("_", " ")
    );

    row(
      "Amount",
      `INR ${(payment.amount / 100).toFixed(2)}`
    );

    row("Currency", payment.currency);

    row("Status", payment.status);

    row("Payment ID", payment.razorpayPaymentId ?? "-");

    row(
      "Date",
      payment.createdAt.toLocaleDateString("en-IN")
    );

    y -= 20;

    page.drawLine({
      start: { x: 50, y },
      end: { x: width - 50, y },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    y -= 40;

    page.drawText("Thank you for your purchase!", {
      x: 50,
      y,
      size: 14,
      font: bold,
    });

    y -= 25;

    page.drawText(
      "This invoice confirms your successful payment for ESOP Value Clarity.",
      {
        x: 50,
        y,
        size: 11,
        font: regular,
      }
    );

    const pdfBytes = await pdf.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=invoice-${payment.id}.pdf`,
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to generate invoice.",
      },
      { status: 500 }
    );
  }
}