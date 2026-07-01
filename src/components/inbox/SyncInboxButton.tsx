"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export function SyncInboxButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSync() {
    setLoading(true);
    try {
      const res = await fetch("/api/inbox/sync", { method: "POST" });
      if (!res.ok) {
        throw new Error("Failed to queue sync");
      }
      const data = await res.json();
      alert(`Successfully queued sync for ${data.queuedCount} mailboxes. Messages will appear shortly.`);
      router.refresh();
    } catch (error) {
      console.error("Sync failed", error);
      alert("Failed to sync inbox.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button 
      onClick={handleSync}
      disabled={loading}
      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 gap-2 disabled:opacity-50"
    >
      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Syncing..." : "Sync Inbox"}
    </button>
  );
}
