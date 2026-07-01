import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        list: true,
        template: true,
        mailbox: true,
        _count: {
          select: { emailLogs: true }
        }
      }
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("Failed to fetch campaigns", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, listId, templateId, mailboxId } = await req.json();

    if (!name || !listId || !templateId || !mailboxId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let org = await prisma.organization.findFirst();
    if (!org) {
      org = await prisma.organization.create({
        data: { name: "Right Innovations" }
      });
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        listId,
        templateId,
        mailboxId,
        organizationId: org.id,
        status: "DRAFT"
      }
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Failed to create campaign", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
