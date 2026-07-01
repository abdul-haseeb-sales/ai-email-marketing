import { Worker, Job } from "bullmq";
import Redis from "ioredis";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import { parseTemplateVariables } from "./src/lib/variable-parser";

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
        text: parsedBody,
      });

      console.log(`✅ Sent email to ${lead.email} - MsgID: ${info.messageId}`);

      await prisma.emailLog.create({
        data: {
          organizationId: campaign.organizationId,
          campaignId: campaign.id,
          leadId: lead.id,
          subject: parsedSubject,
          body: parsedBody,
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

campaignWorker.on("failed", (job, err) => {
  console.error(`Campaign Job ${job?.id} failed:`, err.message);
});

emailSenderWorker.on("failed", (job, err) => {
  console.error(`Email Job ${job?.id} failed:`, err.message);
});
