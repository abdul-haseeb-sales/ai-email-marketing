"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Pause } from "lucide-react";

export function CampaignActionButtons({ campaignId, status }: { campaignId: string, status: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleAction(action: "start" | "pause") {
    setLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/${action}`, {
        method: "POST"
      });
      if (!res.ok) {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
      router.refresh();
    } catch (error) {
      console.error(`Failed to ${action} campaign`, error);
    } finally {
      setLoading(false);
    }
  }

  if (status === "DRAFT" || status === "PAUSED") {
    return (
      <button 
        onClick={() => handleAction("start")}
        disabled={loading}
        className="text-primary hover:underline text-xs font-medium mr-4 inline-flex items-center gap-1 disabled:opacity-50"
      >
        <Play className={`h-3 w-3 ${loading ? "animate-pulse" : ""}`} /> 
        {loading ? "Starting..." : "Start"}
      </button>
    );
  }

  if (status === "RUNNING") {
    return (
      <button 
        onClick={() => handleAction("pause")}
        disabled={loading}
        className="text-yellow-600 hover:underline text-xs font-medium mr-4 inline-flex items-center gap-1 disabled:opacity-50"
      >
        <Pause className={`h-3 w-3 ${loading ? "animate-pulse" : ""}`} /> 
        {loading ? "Pausing..." : "Pause"}
      </button>
    );
  }

  return null;
}
