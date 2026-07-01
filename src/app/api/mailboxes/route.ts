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

    const mailboxes = await prisma.mailbox.findMany({
      orderBy: { createdAt: "desc" },
      include: { domain: true }
    });

    return NextResponse.json(mailboxes);
  } catch (error) {
    console.error("Failed to fetch mailboxes", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { email, displayName, domainId, smtpHost, smtpPort, imapHost, imapPort } = body;

    if (!email || !domainId || !smtpHost || !smtpPort || !imapHost || !imapPort) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await prisma.mailbox.findUnique({
      where: { email }
    });

    if (existing) {
      return NextResponse.json({ error: "Mailbox already exists" }, { status: 400 });
    }

    const newMailbox = await prisma.mailbox.create({
      data: {
        email,
        displayName,
        domainId,
        smtpHost,
        smtpPort: parseInt(smtpPort),
        imapHost,
        imapPort: parseInt(imapPort),
      }
    });

    return NextResponse.json(newMailbox);
  } catch (error) {
    console.error("Failed to create mailbox", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
