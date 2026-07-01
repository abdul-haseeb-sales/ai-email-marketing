"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";

export function BlacklistCheckButton({ domainId }: { domainId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleCheck() {
    setLoading(true);
    try {
      const res = await fetch(`/api/domains/${domainId}/blacklist`, { method: "POST" });
      if (!res.ok) {
        throw new Error("Failed to check blacklist");
      }
      const data = await res.json();
      if (data.isListed) {
        alert(`Warning: Domain is listed on ${data.listedOn.join(", ")}`);
      } else {
        alert("Domain is CLEAN on all checked blacklists.");
      }
      router.refresh();
    } catch (error) {
      console.error("Blacklist check failed", error);
      alert("Failed to perform blacklist check.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button 
      onClick={handleCheck}
      disabled={loading}
      className="inline-flex items-center text-primary hover:underline text-xs font-medium disabled:opacity-50 gap-1"
    >
      <Shield className={`h-3 w-3 ${loading ? "animate-pulse" : ""}`} />
      {loading ? "Checking..." : "Check Now"}
    </button>
  );
}
