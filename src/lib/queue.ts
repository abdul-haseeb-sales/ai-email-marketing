import { Queue, Worker, Job } from "bullmq";
import Redis from "ioredis";

// Reuse the same Redis connection if possible
const connection = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
  maxRetriesPerRequest: null
});

export const emailQueue = new Queue("email-sending-queue", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  }
});
