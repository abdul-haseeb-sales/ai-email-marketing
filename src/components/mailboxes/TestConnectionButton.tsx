"use client";

import { useState } from "react";
import { Plug } from "lucide-react";
import { useRouter } from "next/navigation";

export function TestConnectionButton({ mailboxId }: { mailboxId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleTest() {
    setLoading(true);
    try {
      const res = await fetch(`/api/mailboxes/${mailboxId}/test`, { method: "POST" });
      const data = await res.json();
      
      if (!res.ok) {
        alert(`Test Failed: ${data.details || data.error}`);
      } else {
        alert("Connection Test Successful!");
      }
      router.refresh();
    } catch (error) {
      console.error("Test failed", error);
      alert("Test failed due to a network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button 
      onClick={handleTest}
      disabled={loading}
      className="text-primary hover:underline text-xs font-medium inline-flex items-center gap-1 disabled:opacity-50"
    >
      <Plug className={`h-3 w-3 ${loading ? "animate-pulse" : ""}`} />
      {loading ? "Testing..." : "Test Connection"}
    </button>
  );
}
