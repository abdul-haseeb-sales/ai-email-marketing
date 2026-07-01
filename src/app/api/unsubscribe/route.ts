import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { leadId } = await req.json();

    if (!leadId) {
      return NextResponse.json({ error: "Missing lead ID" }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    await prisma.lead.update({
      where: { id: leadId },
      data: { status: "UNSUBSCRIBED" }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to unsubscribe", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
