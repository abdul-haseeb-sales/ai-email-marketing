"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export function VerifyButton({ domainId }: { domainId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleVerify() {
    setLoading(true);
    try {
      await fetch(`/api/domains/${domainId}/verify`, { method: "POST" });
      router.refresh();
    } catch (error) {
      console.error("Verification failed", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button 
      onClick={handleVerify}
      disabled={loading}
      className="text-primary hover:underline text-xs font-medium inline-flex items-center gap-1 ml-4 disabled:opacity-50"
    >
      <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Verifying..." : "Verify DNS"}
    </button>
  );
}
