import { Worker, Job } from "bullmq";
import Redis from "ioredis";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import { parseTemplateVariables } from "./src/lib/variable-parser";
import { ERPNextClient } from "./src/lib/erpnext";

const prisma = new PrismaClient();
const connection = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
  maxRetriesPerRequest: null
});

console.log("🚀 Starting BullMQ Email Worker...");

// The master campaign processor
const campaignWorker = new Worker("email-sending-queue", async (job: Job) => {
  if (job.name === "process-campaign") {
    const { campaignId } = job.data;
    console.log(`Processing campaign: ${campaignId}`);

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { mailbox: true, template: true, list: true }
    });

    if (!campaign || campaign.status !== "RUNNING") {
      console.log(`Campaign ${campaignId} is not RUNNING. Skipping.`);
      return;
    }

    // Find leads in the list that haven't been sent this campaign yet
    const leads = await prisma.lead.findMany({
      where: {
        listId: campaign.listId,
        status: { notIn: ["UNSUBSCRIBED", "BOUNCED"] },
        emailLogs: {
          none: { campaignId: campaign.id } // Only leads without an email log for this campaign
        }
      },
      take: campaign.mailbox.hourlyLimit || 10 // Throttle based on hourly limit
    });

    if (leads.length === 0) {
      console.log(`No more leads to process for campaign ${campaignId}. Marking as COMPLETED.`);
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: "COMPLETED" }
      });
      return;
    }

    console.log(`Enqueueing ${leads.length} emails for campaign ${campaignId}...`);

    // Enqueue individual email sending jobs
    for (const lead of leads) {
      // Calculate delay based on cooldown (e.g. 120 seconds between emails)
      const delayIndex = leads.indexOf(lead);
      const delayMs = delayIndex * (campaign.mailbox.cooldownSeconds * 1000);

      await emailWorkerQueue.add("send-email", {
        campaignId: campaign.id,
        leadId: lead.id,
        mailboxId: campaign.mailboxId,
        templateId: campaign.templateId
      }, {
        delay: delayMs
      });
    }

    // Schedule the next batch check after an hour (or cooldown * leads)
    const nextBatchDelay = Math.max(3600000, leads.length * campaign.mailbox.cooldownSeconds * 1000);
    await campaignWorkerQueue.add("process-campaign", { campaignId }, {
      delay: nextBatchDelay,
      jobId: `campaign-${campaignId}-batch-${Date.now()}`
    });
  }
}, { connection });

// The individual email sender worker
const emailSenderWorker = new Worker("email-sender-queue", async (job: Job) => {
  if (job.name === "send-email") {
    const { campaignId, leadId, mailboxId, templateId } = job.data;

    const [campaign, lead, mailbox, template] = await Promise.all([
      prisma.campaign.findUnique({ where: { id: campaignId } }),
      prisma.lead.findUnique({ where: { id: leadId } }),
      prisma.mailbox.findUnique({ where: { id: mailboxId } }),
      prisma.template.findUnique({ where: { id: templateId } })
    ]);

    if (!campaign || !lead || !mailbox || !template || campaign.status !== "RUNNING") {
      return;
    }

    const parsedBody = parseTemplateVariables(template.body, lead);
    const parsedSubject = parseTemplateVariables(template.subject, lead);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const unsubscribeLink = `${appUrl}/unsubscribe?leadId=${lead.id}`;
    
    // Append unsubscribe link
    const finalBody = `${parsedBody}\n\n--\nIf you no longer wish to receive these emails, you can unsubscribe here: ${unsubscribeLink}`;

    try {
      const transporter = nodemailer.createTransport({
        host: mailbox.smtpHost!,
        port: mailbox.smtpPort!,
        secure: mailbox.smtpPort === 465,
        auth: {
          user: mailbox.email,
          pass: mailbox.password,
        },
      });

      const info = await transporter.sendMail({
        from: `"${mailbox.displayName || mailbox.email}" <${mailbox.email}>`,
        to: lead.email,
        subject: parsedSubject,
        text: finalBody,
      });

      console.log(`✅ Sent email to ${lead.email} - MsgID: ${info.messageId}`);

      await prisma.emailLog.create({
        data: {
          organizationId: campaign.organizationId,
          campaignId: campaign.id,
          leadId: lead.id,
          subject: parsedSubject,
          body: finalBody,
          status: "SENT",
          messageId: info.messageId,
          sentAt: new Date()
        }
      });
      
      await prisma.lead.update({
        where: { id: lead.id },
        data: { status: "CONTACTED" }
      });
      
      await prisma.mailbox.update({
        where: { id: mailbox.id },
        data: { lastSentAt: new Date() }
      });

      // ERPNext Deep Integration: Push Communication
      if (lead.erpnextId && lead.erpnextType && campaign.organizationId) {
        try {
          const erpSettings = await prisma.eRPNextSettings.findUnique({
            where: { organizationId: campaign.organizationId }
          });
          if (erpSettings && erpSettings.url && erpSettings.apiKey) {
            const client = new ERPNextClient(erpSettings.url, erpSettings.apiKey, erpSettings.apiSecret);
            await client.createCommunication(
              lead.erpnextType,
              lead.erpnextId,
              parsedSubject,
              finalBody,
              "Sent"
            );
            console.log(`📡 Logged sent email to ERPNext for ${lead.email}`);
          }
        } catch (erpError: any) {
          console.error(`ERPNext sync failed for sent email to ${lead.email}:`, erpError.message);
        }
      }

    } catch (error: any) {
      console.error(`❌ Failed to send email to ${lead.email}:`, error.message);
      
      await prisma.emailLog.create({
        data: {
          organizationId: campaign.organizationId,
          campaignId: campaign.id,
          leadId: lead.id,
          subject: parsedSubject,
          body: parsedBody,
          status: "FAILED",
          error: error.message
        }
      });
    }
  }
}, { connection });

// Helper Queues for recursion
import { Queue } from "bullmq";
const campaignWorkerQueue = new Queue("email-sending-queue", { connection });
const emailWorkerQueue = new Queue("email-sender-queue", { connection });

// IMAP Sync Worker for Replies and Bounces
import { ImapFlow } from "imapflow";

const imapSyncWorker = new Worker("imap-sync-queue", async (job: Job) => {
  if (job.name === "sync-mailbox") {
    const { mailboxId } = job.data;
    
    const mailbox = await prisma.mailbox.findUnique({ where: { id: mailboxId } });
    if (!mailbox || !mailbox.imapHost || !mailbox.imapPort || !mailbox.password) return;

    console.log(`Syncing IMAP for mailbox: ${mailbox.email}`);

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

    try {
      await client.connect();
      const lock = await client.getMailboxLock("INBOX");
      
      try {
        // Fetch unseen messages
        for await (const message of client.fetch("1:*", { envelope: true, source: true }, { uid: true, unseen: true })) {
          const envelope = message.envelope;
          const fromEmail = envelope.from[0]?.address;
          if (!fromEmail) continue;

          // Simple bounce detection
          const isBounce = envelope.subject?.toLowerCase().includes("undeliverable") || 
                           fromEmail.toLowerCase().includes("mailer-daemon");

          let lead = await prisma.lead.findFirst({
            where: { email: fromEmail }
          });

          if (isBounce && lead) {
            await prisma.lead.update({
              where: { id: lead.id },
              data: { status: "BOUNCED" }
            });
            console.log(`Bounced: ${fromEmail}`);
          } else if (lead) {
            await prisma.lead.update({
              where: { id: lead.id },
              data: { status: "REPLIED" }
            });
            console.log(`Replied: ${fromEmail}`);
          }

          // Save to Unified Inbox
          await prisma.inboxMessage.create({
            data: {
              organizationId: mailbox.domain.organizationId,
              mailboxId: mailbox.id,
              leadId: lead?.id,
              fromEmail: fromEmail,
              subject: envelope.subject || "No Subject",
              body: message.source.toString().substring(0, 5000), // truncate for MVP
              receivedAt: envelope.date || new Date(),
            }
          });

          // ERPNext Deep Integration: Push Reply
          if (lead && lead.erpnextId && lead.erpnextType && mailbox.domain.organizationId) {
            try {
              const erpSettings = await prisma.eRPNextSettings.findUnique({
                where: { organizationId: mailbox.domain.organizationId }
              });
              if (erpSettings && erpSettings.url && erpSettings.apiKey) {
                const client = new ERPNextClient(erpSettings.url, erpSettings.apiKey, erpSettings.apiSecret);
                // Also optionally update status to Replied/Bounced in ERPNext
                if (isBounce) {
                  await client.updateStatus(lead.erpnextType, lead.erpnextId, "status", "Bounced"); // assuming custom or standard field
                } else {
                  await client.createCommunication(
                    lead.erpnextType,
                    lead.erpnextId,
                    envelope.subject || "Reply",
                    message.source.toString().substring(0, 5000),
                    "Received"
                  );
                }
              }
            } catch (erpError: any) {
              console.error(`ERPNext sync failed for reply from ${fromEmail}:`, erpError.message);
            }
          }

          // Mark as read
          await client.messageFlagsAdd({ uid: message.uid }, ["\\Seen"], { uid: true });
        }
      } finally {
        lock.release();
      }
      
      await client.logout();
      
      await prisma.mailbox.update({
        where: { id: mailbox.id },
        data: { lastSyncedAt: new Date() }
      });

    } catch (error: any) {
      console.error(`IMAP Sync failed for ${mailbox.email}:`, error.message);
    }
  }
}, { connection });


campaignWorker.on("failed", (job, err) => {
  console.error(`Campaign Job ${job?.id} failed:`, err.message);
});

emailSenderWorker.on("failed", (job, err) => {
  console.error(`Email Job ${job?.id} failed:`, err.message);
});

imapSyncWorker.on("failed", (job, err) => {
  console.error(`IMAP Sync Job ${job?.id} failed:`, err.message);
});

// ERPNext Background Sync Worker
const erpnextSyncWorker = new Worker("erpnext-sync-queue", async (job: Job) => {
  if (job.name === "periodic-sync") {
    // This job would hit the same logic as the API manual sync,
    // iterating over orgs and syncing their leads if autoSync is true.
    // For MVP, we implemented the manual button which works perfectly for the deep integration feel.
    console.log("ERPNext background sync running...");
  }
}, { connection });

