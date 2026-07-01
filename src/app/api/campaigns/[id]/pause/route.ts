import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const campaignId = params.id;
    
    // Update campaign status
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "PAUSED" }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to pause campaign", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
