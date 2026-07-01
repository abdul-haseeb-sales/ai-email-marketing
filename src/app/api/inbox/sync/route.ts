import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { imapSyncQueue } from "@/lib/queue";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mailboxes = await prisma.mailbox.findMany({
      where: { status: "ACTIVE" }
    });

    for (const mb of mailboxes) {
      await imapSyncQueue.add("sync-mailbox", { mailboxId: mb.id });
    }

    return NextResponse.json({ success: true, queuedCount: mailboxes.length });
  } catch (error) {
    console.error("Failed to queue IMAP sync", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
