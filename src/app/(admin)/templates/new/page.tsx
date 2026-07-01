"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default function CreateTemplatePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    subject: "",
    body: "",
  });

  const availableVariables = [
    "{{first_name}}", "{{last_name}}", "{{business_name}}", 
    "{{industry}}", "{{city}}", "{{website}}"
  ];

  const insertVariable = (variable: string) => {
    setFormData(prev => ({ ...prev, body: prev.body + variable }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create template");
      }

      router.push("/templates");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/templates">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Template</h1>
          <p className="text-muted-foreground text-sm">Design a new personalized email template.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="grid gap-2">
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              placeholder="e.g. Initial Outreach - Real Estate"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              placeholder="e.g. Sales, Follow-up"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="subject">Email Subject</Label>
          <Input
            id="subject"
            placeholder="Quick question about {{business_name}}"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            required
          />
        </div>

        <div className="grid gap-2">
          <div className="flex justify-between items-end">
            <Label htmlFor="body">Email Body</Label>
            <div className="flex gap-2 flex-wrap max-w-lg justify-end">
              {availableVariables.map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => insertVariable(v)}
                  className="text-xs bg-muted hover:bg-primary hover:text-primary-foreground transition-colors px-2 py-1 rounded"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <Textarea
            id="body"
            placeholder="Hi {{first_name}},\n\nI noticed that {{business_name}}..."
            className="min-h-[300px] font-mono text-sm"
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            required
          />
        </div>

        {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

        <div className="flex justify-end">
          <Button type="submit" disabled={loading} className="gap-2">
            <Save className="h-4 w-4" />
            {loading ? "Saving..." : "Save Template"}
          </Button>
        </div>
      </form>
    </div>
  );
}
