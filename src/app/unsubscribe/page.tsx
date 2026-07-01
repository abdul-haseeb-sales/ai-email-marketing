"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldAlert, CheckCircle } from "lucide-react";

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const leadId = searchParams.get("leadId");
  
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleUnsubscribe = async () => {
    if (!leadId) return;
    
    setStatus("loading");
    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to unsubscribe");
      }
      
      setStatus("success");
    } catch (error: any) {
      setStatus("error");
      setErrorMsg(error.message);
    }
  };

  if (!leadId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm border max-w-md w-full text-center">
          <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Invalid Link</h1>
          <p className="text-gray-500 text-sm">
            This unsubscribe link is missing required information. Please check the link from your email.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-sm border max-w-md w-full text-center">
        {status === "success" ? (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Unsubscribed Successfully</h1>
            <p className="text-gray-500 text-sm mb-6">
              You have been successfully removed from our mailing list. You will no longer receive automated emails from us.
            </p>
          </>
        ) : (
          <>
            <ShieldAlert className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Unsubscribe</h1>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure you want to unsubscribe from future emails?
            </p>
            
            {status === "error" && (
              <p className="text-red-500 text-sm font-medium mb-4">{errorMsg}</p>
            )}
            
            <button
              onClick={handleUnsubscribe}
              disabled={status === "loading"}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {status === "loading" ? "Processing..." : "Yes, Unsubscribe Me"}
            </button>
            <p className="text-xs text-gray-400 mt-4">
              If you clicked this by mistake, you can simply close this window.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
