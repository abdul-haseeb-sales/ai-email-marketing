import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mailboxId = params.id;
    const mailbox = await prisma.mailbox.findUnique({
      where: { id: mailboxId }
    });

    if (!mailbox) {
      return NextResponse.json({ error: "Mailbox not found" }, { status: 404 });
    }

    let smtpSuccess = false;
    let imapSuccess = false;
    let errorDetails = "";

    // Test SMTP
    if (mailbox.smtpHost && mailbox.smtpPort && mailbox.password) {
      try {
        const transporter = nodemailer.createTransport({
          host: mailbox.smtpHost,
          port: mailbox.smtpPort,
          secure: mailbox.smtpPort === 465,
          auth: {
            user: mailbox.email,
            pass: mailbox.password,
          },
        });
        await transporter.verify();
        smtpSuccess = true;
      } catch (e: any) {
        errorDetails += `SMTP Error: ${e.message}. `;
      }
    }

    // Test IMAP
    if (mailbox.imapHost && mailbox.imapPort && mailbox.password) {
      try {
        const client = new ImapFlow({
          host: mailbox.imapHost,
          port: mailbox.imapPort,
          secure: mailbox.imapPort === 993,
          auth: {
            user: mailbox.email,
            pass: mailbox.password,
          },
          logger: false
        });
        
        await client.connect();
        imapSuccess = true;
        await client.logout();
      } catch (e: any) {
        errorDetails += `IMAP Error: ${e.message}. `;
      }
    }

    const status = (smtpSuccess && imapSuccess) ? "ACTIVE" : "ERROR";

    // Update mailbox status
    const updated = await prisma.mailbox.update({
      where: { id: mailboxId },
      data: { status }
    });

    if (!smtpSuccess || !imapSuccess) {
      return NextResponse.json({ 
        error: "Connection test failed", 
        details: errorDetails,
        mailbox: updated 
      }, { status: 400 });
    }

    return NextResponse.json({ success: true, mailbox: updated });
  } catch (error) {
    console.error("Mailbox test failed", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
