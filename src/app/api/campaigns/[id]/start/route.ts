import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { emailQueue } from "@/lib/queue";

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
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (campaign.status === "RUNNING") {
      return NextResponse.json({ error: "Campaign is already running" }, { status: 400 });
    }

    // Update campaign status
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "RUNNING" }
    });

    // Enqueue a master job that will process this campaign
    // (This job will fetch leads and enqueue individual email jobs based on limits)
    await emailQueue.add("process-campaign", { campaignId }, {
      jobId: `campaign-${campaignId}`, // Prevent duplicate master jobs
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to start campaign", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
